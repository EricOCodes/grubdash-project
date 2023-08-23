const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function list(req, res) {
  res.json({ data: orders });
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({
      status: 400,
      message: `Must include a ${propertyName}`,
    });
  };
}

function dishesPropertyIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (!dishes || dishes.length === 0 || !Array.isArray(dishes)) {
    return next({
      status: 400,
      message: "Order must include at least one dish",
    });
  }
  next();
}

function dishQuantityIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  for (let i = 0; i < dishes.length; i++) {
    if (dishes[i].quantity <= 0 || !Number.isInteger(dishes[i].quantity)) {
      return next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an integer greater than 0`,
      });
    }
  }
  next();
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  const newId = nextId();

  const newOrder = {
    id: newId,
    deliverTo,
    mobileNumber,
    status: "pending",
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (foundOrder) {
    res.locals.order = foundOrder;
    next();
    return;
  }
  next({
    status: 404,
    message: `Order does not exist: ${orderId}.`,
  });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function statusPropertyExists(req, res, next) {
  const { data: { status } = {} } = req.body;
  const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
  if (validStatus.includes(status)) {
    return next();
  }
  next({
    status: 400,
    message:
      "Order must have a status of pending, preparing, out-for-delivery, delivered",
  });
}

function orderIsNotDelivered(req, res, next) {
  const status = res.locals.order.status;
  if (status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }
  next();
}

function idsMatch(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;
  if (!id) {
    return next();
  } else if (orderId !== id) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${orderId}`,
    });
  }
  next();
}

function update(req, res) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}

function destroy(req, res, next) {
  const { orderId } = req.params;
  const status = res.locals.order.status;
  if (status === "pending") {
    const index = orders.findIndex((order) => order.id === orderId);
    const deletedOrder = orders.splice(index, 1);
    res.sendStatus(204);
  }
  return next({
    status: 400,
    message: "An order cannot be deleted unless it is pending.",
  });
}

module.exports = {
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    dishesPropertyIsValid,
    dishQuantityIsValid,
    bodyDataHas("dishes"),
    create,
  ],
  list,
  read: [orderExists, read],
  update: [
    orderExists,
    idsMatch,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    orderIsNotDelivered,
    statusPropertyExists,
    bodyDataHas("status"),
    dishesPropertyIsValid,
    dishQuantityIsValid,
    bodyDataHas("dishes"),
    update,
  ],
  delete: [orderExists, destroy],
};
