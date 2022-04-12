// TODO: Implement the /dishes handlers needed to make the tests pass
const path = require("path");

// Using the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Using this function to assign ID's when necessary
const nextId = require("../utils/nextId");

function bodyDataHas(propertyName) {
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (!data[propertyName]) {
        next({ 
            status: 400, 
            message: `Dish must include a ${propertyName}` 
        });        
      }
      return next();
    };
}

function priceIsValidNumber(req, res, next){
    const { data: { price }  = {} } = req.body;
    if (!price || price < 0 || typeof price !== "number"){
        return next({
            status: 400,
            message: `Dish must include a price and it must be an integer greater than 0.`
        });
    }
    next();
}

function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish) {
      res.locals.dish = foundDish;
      res.locals.dishId = dishId;
      return next();
    }
    next({
      status: 404,
      message: `Dish id not found: ${dishId}`,
    });
}

function bodyIdMatchesRouteId(req, res, next) {
    const dishId = res.locals.dishId
    const { data = {} } = req.body;
  
    if (data.id) {
      if (data.id === dishId) {
        return next();
      }
  
      next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${data.id}, Route: ${dishId}`,
      });
    }
  
    return next();
}

function create(req, res) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = {
      id: nextId(),
      name: name,
      description: description,
      price: price,
      image_url: image_url,
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

function update(req, res) {
    const dish = res.locals.dish;
    const { data: { name, description, price, image_url } = {} } = req.body;

    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;
  
    res.json({ data: dish });

}

function list(req, res) {  
    res.json({ data: dishes });
}

function read(req, res, next) {
    res.json({ data: res.locals.dish });
};

module.exports = {
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),               
        priceIsValidNumber,
        create,
    ],
    list,
    read: [dishExists, read],
    update: [
        dishExists,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        priceIsValidNumber,
        bodyIdMatchesRouteId,
        update,
    ],
};