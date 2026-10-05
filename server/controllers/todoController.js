const mongoose = require("mongoose");
const Todo = require("../models/Todo");

const inMemoryTodos = [];

const isMongoConnected = () => mongoose.connection.readyState === 1;

const buildTodo = (todo) => ({
  ...todo,
  _id: todo._id || String(inMemoryTodos.length + 1),
  createdAt: todo.createdAt || new Date().toISOString(),
  updatedAt: todo.updatedAt || new Date().toISOString(),
});

const listTodos = async () => {
  if (!isMongoConnected()) {
    return [...inMemoryTodos].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  return Todo.find().sort({ createdAt: -1 });
};

const addTodo = async (title) => {
  if (!isMongoConnected()) {
    const todo = buildTodo({
      title,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    inMemoryTodos.unshift(todo);
    return todo;
  }

  return Todo.create({ title, completed: false });
};

const updateTodoById = async (id, data) => {
  if (!isMongoConnected()) {
    const index = inMemoryTodos.findIndex((todo) => todo._id === id);
    if (index === -1) return null;

    const updated = {
      ...inMemoryTodos[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    inMemoryTodos[index] = updated;
    return updated;
  }

  return Todo.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};

const deleteTodoById = async (id) => {
  if (!isMongoConnected()) {
    const index = inMemoryTodos.findIndex((todo) => todo._id === id);
    if (index === -1) return null;
    const [deleted] = inMemoryTodos.splice(index, 1);
    return deleted;
  }

  return Todo.findByIdAndDelete(id);
};

// GET /api/todos
const getTodos = async (req, res) => {
  try {
    const todos = await listTodos();
    res.status(200).json(todos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// POST /api/todos
const createTodo = async (req, res) => {
  try {
    const { title } = req.body || {};
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Todo title is required" });
    }

    const todo = await addTodo(title.trim());
    return res.status(201).json(todo);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

// PUT /api/todos/:id
const updateTodo = async (req, res) => {
  try {
    const todo = await updateTodoById(req.params.id, req.body);
    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }
    return res.status(200).json(todo);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

// DELETE /api/todos/:id
const deleteTodo = async (req, res) => {
  try {
    const todo = await deleteTodoById(req.params.id);
    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }
    return res.status(200).json({
      message: "Todo deleted",
      _id: todo._id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { getTodos, createTodo, updateTodo, deleteTodo };
