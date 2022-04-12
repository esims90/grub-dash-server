const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

function list(req, res) {  
    res.json({ data: orders });
}

function bodyDataHas(propertyName) {
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (!data[propertyName]) {
        next({ 
            status: 400, 
            message: `Order must include a ${propertyName} property.` 
        });        
      }
      return next();
    };
}

function bodyDataHasDishesProperty(propertyName) {
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (!data[propertyName] || !data[propertyName].length || !Array.isArray(data[propertyName])) {
        next({ 
            status: 400, 
            message: `Order must include at least one dish.` 
        });        
      }
      return next();
    };
}

function dishesHasDishQuantity(req, res, next){
  const {data: {dishes} = {}} = req.body;
  const quantityMissing = dishes.find((dish) => !dish.quantity); 
  const quantityLessThanOne = dishes.find((dish) => dish.quantity < 1);
  const quantityNotInteger = dishes.find((dish) => !Number.isInteger(dish.quantity));
    if(quantityMissing){
         quantityMissing.index = dishes.indexOf(quantityMissing)
         next({
            status: 400,
            message: `Dish ${quantityMissing.index} must have a quantity that is an integer greater than 0.`
        })
    }
    if(quantityLessThanOne){
         quantityLessThanOne.index = dishes.indexOf(quantityLessThanOne);
         next({
            status: 400, 
            message: `Dish ${quantityLessThanOne.index} must have a quantity that is an integer greater than 0.`
        })
    }
    if(quantityNotInteger){
         quantityNotInteger.index = dishes.indexOf(quantityNotInteger)
         next({
            status: 400, 
            message: `Dish ${quantityNotInteger.index} must have a quantity that is an integer greater than 0.`
        })
    }
  return next();
}

  

function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    if (foundOrder) {
      res.locals.order = foundOrder;
      res.locals.orderId = orderId;
      return next();
    }
    next({
      status: 404,
      message: `No matching order is found for orderId: ${orderId}.`,
    });
}

function bodyIdMatchesRouteId(req, res, next) {
    const orderId = res.locals.orderId
    const { data = {} } = req.body;
  
    if (data.id) {
      if (data.id === orderId) {
        return next();
      }
  
      next({
        status: 400,
        message: `Order id does not match route id. Dish: ${data.id}, Route: ${orderId}`,
      });
    }
  
    return next();
}

function bodyHasStatusProperty(req, res, next) {
  const { data = {} } = req.body;

  if (!data.status || data.status === "invalid") {
    next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, or delivered.",
    });
  }

  if (data.status === "delivered") {
    next({
      status: 400,
      message: "A delivered order cannot be changed.",
    });
  }

  return next();
}

function orderStatusIsPending(req, res, next) {
  const order = res.locals.order;
  const {status} = order;

  if (status === "pending") {
    return next();
  }
  next({
      status: 400,
      message: "An order cannot be deleted unless it is pending.",
    });  
}

function create(req, res) {
    const { data: { deliverTo, mobileNumber, dishes, quantity } = {} } = req.body;
    const newOrder = {
      id: nextId(),
      deliverTo: deliverTo,
      mobileNumber: mobileNumber,
      dishes: dishes,
      quantity: quantity,
    };
  
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

function update(req, res) {
    const order = res.locals.order;
    const { data: { deliverTo, mobileNumber, dishes, quantity } = {} } = req.body;

    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.dishes = dishes;
    order.quantity = quantity;
  
    res.json({ data: order });

}

function destroy(req, res) {
  const {orderId} = req.params;
    const index = orders.findIndex((order) => order.id === orderId);
    orders.splice(index, 1);  
    res.sendStatus(204);
}

function read(req, res, next) {
    res.json({ data: res.locals.order });
};

module.exports = {
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHasDishesProperty("dishes"),
        dishesHasDishQuantity,               
        create,
    ],
    list,
    read: [orderExists, read],
    update: [
        orderExists,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHasDishesProperty("dishes"),
        dishesHasDishQuantity,
        bodyIdMatchesRouteId,
        bodyHasStatusProperty,
        update,
    ],
  delete: [orderExists, orderStatusIsPending, destroy],
};
