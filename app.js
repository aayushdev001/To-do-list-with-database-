const express = require('express');
const app = express();
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static("public"))
mongoose.connect("mongodb://localhost:27017/todolistdb");

const itemschema = mongoose.Schema({
    name: String
})
const itemmodel = mongoose.model("Itemcollection", itemschema)
app.set("view engine", "ejs");

// let items = ["Buy Food", "Cook Food", "Eat Food"];
const item1 = new itemmodel({
    name: "Welcome to  to-do list"
})
const item2 = new itemmodel({
    name: "Hit the + button to add a new item"
})
const item3 = new itemmodel({
    name: "<-- Hit this to delete an item"
})

const defaultItem = [item1, item2, item3];

// For Custom Item List
const listschema = mongoose.Schema({
    name: String,
    items: [itemschema]
})
const listmodel = mongoose.model('Listcollection', listschema)

app.get('/', (req, res) => {
    let today = new Date();
    var options = {
        weekday: "long",
        day: "numeric",
        month: "long"
    };

    let day = today.toLocaleDateString("en-us", options);

    itemmodel.find({}, (err, data) => {
        if (data.length == 0) {
            itemmodel.insertMany(defaultItem, (err) => {
                if (!err) {
                    console.log("Successfully added default items");
                }
            })
            res.redirect("/")
        }
        else {

            // console.log(data);
            res.render("list", { kindofday: "Today", newListItem: data })
        }
    })

});

//Custom List Route
app.get("/:customListName", (req, res) => {
    const customList = _.capitalize(req.params.customListName);
    console.log(req.params.customListName);
    listmodel.findOne({ name: customList }, (err, foundlist) => {
        if (!err) {
            if (!foundlist) {
                //create a new list
                const list = new listmodel({
                    name: customList,
                    items: defaultItem
                })
                list.save();
                console.log(list.name+" list");
                res.redirect("/" + customList);
            }
            else {
                //show an existing list
                res.render("list", { kindofday: foundlist.name, newListItem: foundlist.items })
            }
        }

    })
})


app.post("/", (req, res) => {
    let item = req.body.newItem;
    const list = req.body.button;
    console.log(list);
    itemnew = new itemmodel({
        name: item
    })

    if(list==="Today")
    {

        itemnew.save();
        res.redirect("/")
        // items.push(item);
        // console.log(items);
    }
    else
    {
        listmodel.findOne({name:list},(err,foundlist) =>{
            foundlist.items.push(itemnew)
            foundlist.save();
            res.redirect("/"+list);
        })
    }
})

app.post("/delete", (req, res) => {
    const checkeditemid = req.body.checkbox;
    const listname = req.body.listname;
    // console.log(checkeditemid);
    if(listname === "Today")
    {
        itemmodel.findByIdAndRemove(checkeditemid, (err) => {
            if (!err) {
                console.log("Successfully deleted item");
                res.redirect("/");
            }
        })
    }
    else
    {
        listmodel.findOneAndUpdate({ name:listname},{$pull:{items:{_id:checkeditemid}}}, (err,foundlist) => {
            if (!err) {
                res.redirect("/"+listname);
            }
        })
    }
    
})






app.listen(3000, () => {
    console.log('listening on port 3000');
})