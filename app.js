//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-shivani:test123@cluster0.8orzr.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemsSchema = {
  name: String
};
const Item = mongoose.model("items", itemsSchema);

const item1 = new Item({
  name: "Welcome to your To Do List!"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: " <--- Click this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  //Here foundItems is an array of document objects.
  Item.find({}, function(err, foundItems) {

    //foundItems is initially an empty array
    //The following 'if' is such that the defaultItems are added to the database only once.
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB!!");
        }
      });
      //the length of foundItems is not equal to 0.
      //when redirected, it will enter the else and will be rendered.
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  //Here foundList is a document object
  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }

  });
});

app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  //checks if List name is the default list or a custom list
  if (listName === "Today") {
    item.save();
    //saves in the databse
    res.redirect("/");
    //The new item is already saved in the database now.
    //By redirecting to the home route, it gets added.

  } else {
    //The custom list is found out from the database
    //foundList is the document
    List.findOne({name: listName}, function(err, foundList) {
      //foundList.items is the embedded array of items, where new item created 'item' is pushed into the array
      foundList.items.push(item);
      foundList.save();
      //new item is saved in the custom list
      res.redirect("/" + listName);
      //redirected to /listName
    });
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today") {
  Item.findByIdAndRemove(checkedItemId, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log("Successfully removed!");
      res.redirect("/");
    }
  });
} else {
  List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
}
});


// app.get("/work", function(req, res) {
//   res.render("list", {
//     listTitle: "Work List",
//     newListItems: workItems
//   });
// });

app.get("/about", function(req, res) {
  res.render("about");
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server has started Successfully!");
});
