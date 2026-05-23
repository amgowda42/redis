import { Employee } from "../model/employee.js";
import { redis } from "../config/redis.js";

const CACHE_KEY = {
  all: "employees:all",
  byId: (id) => `employee:${id}`,
};

const CACHE_TTL = 300;// Cache time-to-live in seconds (5 minutes)

export const createEmployee = async (req, res) => {
  const { name, email, department } = req.body;
  if (!name || !email || !department) {
    throw new Error("name, email, and department are required");
  }

  const exist = await Employee.findOne({ email });
  if (exist) {
    throw new Error("Employee with this email already exists");
  }

  const newEmployee = await Employee.create({ name, email, department });

  await redis.del(CACHE_KEY.all); //invalidating the cache for all employees(cache miss for next request)

  res.status(201).json({
    success: true,
    data: newEmployee,
    message: "Employee created successfully",
  });
};

export const getEmployees = async (req, res) => {
  // CHECK CACHE
  const cachedEmployees = await redis.get(CACHE_KEY.all);

  // CACHE HIT
  if (cachedEmployees) {
    console.log("Employees retrieved from cache");

    return res.status(200).json({
      success: true,
      source: "cache",
      data: JSON.parse(cachedEmployees),
      message: "Employees retrieved from cache",
    });
  }

  // CACHE MISS
  console.log("Employees retrieved from DB");

  const employees = await Employee.find();

  // SAVE TO CACHE
  await redis.setex(CACHE_KEY.all, CACHE_TTL, JSON.stringify(employees));

  console.log("Employees saved to cache");

  res.status(200).json({
    success: true,
    source: "database",
    data: employees,
    message: "Employees retrieved from database",
  });
};
export const getEmployeeById = async (req, res) => {
  const { id } = req.params;

  //try from cache first
  const cachedEmployee = await redis.get(CACHE_KEY.byId(id));

  if (cachedEmployee) {
    console.log(`Employee ${id} retrieved from cache`);

    return res.status(200).json({
      success: true,
      source: "cache",
      data: JSON.parse(cachedEmployee),
      message: "Employee retrieved from cache",
    });
  }

  // CACHE MISS — go to DB
  const employee = await Employee.findById(id);
  if (!employee) {
    throw new Error("Employee not found");
  }

  // Save to cache
  await redis.setex(CACHE_KEY.byId(id), CACHE_TTL, JSON.stringify(employee));
  console.log(`Employee ${id} saved to cache`);

  res.status(200).json({
    success: true,
    source: "database",
    data: employee,
    message: "Employee retrieved from database",
  });
};

export const updateEmployee = async (req, res) => {
  const { id } = req.params;

  if (!req.body) throw new Error("No update data provided");

  if (req.body.email) {
    const conflict = await Employee.findOne({
      email: req.body.email,
      _id: { $ne: id },
    });

    if (conflict)
      throw new Error("Another employee with this email already exists");
  }

  const employee = await Employee.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!employee) throw new Error("Employee not found");

  await redis.del(CACHE_KEY.byId(id));
  await redis.del(CACHE_KEY.all);

  res.json({
    success: true,
    data: employee,
    message: "Employee updated successfully",
  });
};

export const deleteEmployee = async (req, res) => {
  const { id } = req.params;

  const employee = await Employee.findByIdAndDelete(id);
  if (!employee) throw new Error("Employee not found");

  await redis.del(CACHE_KEY.byId(id));
  await redis.del(CACHE_KEY.all);

  res.status(200).json({
    success: true,
    message: "Employee deleted successfully",
  });
};
