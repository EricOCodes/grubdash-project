const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

function list(req, res) {
  res.json({ data: dishes });
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

function pricePropertyIsValidNumber(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price <= 0 || !Number.isInteger(price)) {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }
  next();
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newId = nextId();

  const newDish = {
    id: newId,
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);

  if (foundDish) {
    res.locals.dish = foundDish;
    next();
    return;
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}.`,
  });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function idsMatch(req, res, next) {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;

  if (!id) {
    return next();
  } else if (dishId !== id) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
  next();
}

function update(req, res, next) {
  const dish = res.locals.dish;

  const { data: { name, description, price, image_url } = {} } = req.body;

  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}
// TODO: Implement the /dishes handlers needed to make the tests pass
module.exports = {
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("image_url"),
    pricePropertyIsValidNumber,
    bodyDataHas("price"),
    create,
  ],
  list,
  read: [dishExists, read],
  update: [
    dishExists,
    idsMatch,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("image_url"),
    pricePropertyIsValidNumber,
    bodyDataHas("price"),
    update,
  ],
};
