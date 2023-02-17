const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
var isDateValid = require("date-fns/isValid");

// Define The Path for Database
const databasePath = path.join(__dirname, "todoApplication.db");

// Calling Express and app JSON
const app = express();
app.use(express.json());

// Initialization The Database And Server
let database = null;

const initializationDatabaseAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server is Running at: http://localhost:3000/")
    );
  } catch (error) {
    console.log(`Database Error: '${error.message}'`);
    process.exit(1);
  }
};
initializationDatabaseAndServer();

// Checking Validity For Category Priority and Status
const hasStatusValidate = (requestedQue) => {
  return requestedQue.status !== undefined;
};
const hasCategoryValidate = (requestedQue) => {
  return requestedQue.category !== undefined;
};
const hasPriorityValidate = (requestedQue) => {
  return requestedQue.priority !== undefined;
};
const hasDateValidity = (requestedQue) => {
  return requestedQue.date !== undefined;
};
const isValidData = (request, response, next) => {
  const { category, priority, status, date } = request.query;
  const priorityValidation = ["HIGH", "MEDIUM", "LOW"];
  const statusValidation = ["TO DO", "IN PROGRESS", "DONE"];
  const categoryValidation = ["WORK", "HOME", "LEARNING"];
  const checkStatus = statusValidation.includes(status);
  const checkCategory = categoryValidation.includes(category);
  const checkPriority = priorityValidation.includes(priority);

  switch (true) {
    case hasStatusValidate(request.query):
      if (checkStatus === true) {
        next();
        break;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
    case hasCategoryValidate(request.query):
      if (checkCategory === true) {
        next();
        break;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
    case hasPriorityValidate(request.query):
      if (checkPriority === true) {
        next();
        break;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
    case hasDateValidity(request.query):
      if (isDateValid(date, "yyyy-MM-dd") === true) {
        next();
        break;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
    default:
      next();
  }
};

// API 1 Formatting
const formattingTodo = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

// Filtering
const hasAllProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined &&
    requestQuery.priority !== undefined &&
    requestQuery.status !== undefined
  );
};

const hasOnlystatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasOnlyPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusAndPriority = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasOnlyCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

// API 1
app.get("/todos/", isValidData, async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", category, priority, status } = request.query;

  switch (true) {
    case hasAllProperty(request.query):
      getTodoQuery = `
          SELECT *
          FROM todo
          WHERE todo LIKE '%${search_q}%' AND 
                category = '${category}' AND
                priority = '${priority}' AND
                status = '${status}';`;
      break;
    case hasOnlystatus(request.query):
      getTodoQuery = `
          SELECT *
          FROM todo
          WHERE todo LIKE '%${search_q}%' AND 
                status = '${status}';`;
      break;
    case hasOnlyPriority(request.query):
      getTodoQuery = `
          SELECT *
          FROM todo
          WHERE todo LIKE '%${search_q}%' AND 
                priority = '${priority}';`;
      break;
    case hasStatusAndPriority(request.query):
      getTodoQuery = `
          SELECT *
          FROM todo
          WHERE todo LIKE '%${search_q}%' AND 
                priority = '${priority}' AND
                status = '${status}';`;
      break;
    case hasCategoryAndStatus(request.query):
      getTodoQuery = `
          SELECT *
          FROM todo
          WHERE todo LIKE '%${search_q}%' AND 
                category = '${category}' AND
                status = '${status}';`;
      break;
    case hasOnlyCategory(request.query):
      getTodoQuery = `
          SELECT *
          FROM todo
          WHERE todo LIKE '%${search_q}%' AND 
                category = '${category}';`;
      break;
    case hasCategoryAndPriority(request.query):
      getTodoQuery = `
          SELECT *
          FROM todo
          WHERE todo LIKE '%${search_q}%' AND 
                category = '${category}' AND
                priority = '${priority}';`;
      break;
    default:
      getTodoQuery = `
          SELECT *
          FROM todo
          WHERE todo LIKE '%${search_q}%';`;
      break;
  }
  data = await database.all(getTodoQuery);
  response.send(data.map((item) => formattingTodo(item)));
});

// API 2
app.get("/todos/:todoId/", isValidData, async (request, response) => {
  const { todoId } = request.params;
  const queryToGetPerId = `
  SELECT *
  FROM todo
  WHERE id = '${todoId}';`;
  const gettingAsPerId = await database.get(queryToGetPerId);
  response.send(formattingTodo(gettingAsPerId));
});

// API 3
app.get("/agenda/", isValidData, async (request, response) => {
  const { date } = request.query;
  console.log(date);
  const queryToGetDataTillDate = `
    SELECT * FROM todo WHERE due_date = '${date}';`;
  const dataTillDueDate = await database.all(queryToGetDataTillDate);
  response.send(dataTillDueDate.map((item) => formattingTodo(item)));
});

// API 4
app.post("/todos/", isValidData, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const queryToPostTodoItem = `
    INSERT INTO todo(id, todo, priority, status, category, due_date)
    VALUES ('${id}', '${todo}','${priority}','${status}','${category}','${dueDate}');`;
  await database.run(queryToPostTodoItem);
  response.send("Todo Successfully Added");
});

// API 5
app.put("/todos/:todoId/", isValidData, async (request, response) => {
  let updateValue = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateValue = "Status";
      break;
    case requestBody.todo !== undefined:
      updateValue = "Todo";
      break;
    case requestBody.priority !== undefined:
      updateValue = "Priority";
      break;
    case requestBody.category !== undefined:
      updateValue = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateValue = "Due Date";
      break;
  }
  const { todoId } = request.params;
  const queryToGetPreviousValues = `
        SELECT * 
        FROM todo 
        WHERE id = '${todoId}';`;

  const previousTodo = await database.get(queryToGetPreviousValues);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;
  const queryToUpdate = `
    UPDATE todo
    SET
        todo = '${todo}',
        priority = '${priority}',
        status = '${status}',
        category = '${category}',
        due_date = '${dueDate}';`;
  await database.run(queryToUpdate);
  response.send(`${updateValue} Updated`);
});

// API 6
app.delete("/todos/:todoId/", isValidData, async (request, response) => {
  const { todoId } = request.params;
  const queryToDelete = `
  DELETE FROM todo
  WHERE id = '${todoId}'`;
  await database.run(queryToDelete);
  response.send("Todo Deleted");
});

module.exports = app;
