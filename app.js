const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const isValid = require('date-fns/isValid')
const format = require('date-fns/format')
const app = express()
app.use(express.json())

const dbpath = path.join(__dirname, 'todoApplication.db')

let db = null

//Initializing server

const initializer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('the server is Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error : ${e.message}`)
    process.exit(1)
  }
}

initializer()

const hasStatusTrue = requestQuery => {
  return (
    requestQuery.status != undefined &&
    requestQuery.priority == undefined &&
    requestQuery.category == undefined
  )
}

const hasPriorityTrue = requestQuery => {
  return (
    requestQuery.priority != undefined &&
    requestQuery.status == undefined &&
    requestQuery.cateogry == undefined
  )
}

const hasCategoryTrue = requestQuery => {
  return (
    requestQuery.category != undefined &&
    requestQuery.priority == undefined &&
    requestQuery.status == undefined
  )
}

const hasCategoryAndPriority = requestQuery => {
  return (
    requestQuery.category != undefined && requestQuery.priority != undefined
  )
}

const hasCategoryAndStatus = requestQuery => {
  return requestQuery.category != undefined && requestQuery.status != undefined
}

const hasPriorityAndStatus = requestQuery => {
  return requestQuery.priority != undefined && requestQuery.status != undefined
}

const conversion = data => {
  return {
    id: data.id,
    todo: data.todo,
    priority: data.priority,
    status: data.status,
    category: data.category,
    dueDate: format(new Date(data.due_date), 'yyyy-MM-dd'),
  }
}

//API - 1
app.get('/todos/', async (request, response) => {
  const details = request.query
  const {priority, status, category, search_q = ''} = details
  let sqlQuery
  let data
  switch (true) {
    case hasStatusTrue(request.query):
      if (status != 'TO DO' && status != 'IN PROGRESS' && status != 'DONE') {
        response.status(400)
        response.send('Invalid Todo Status')
      } else {
        sqlQuery = `SELECT * FROM todo WHERE status = '${status}';`
        data = await db.all(sqlQuery)
        response.send(data.map(everyItem => conversion(everyItem)))
      }
      break
    case hasPriorityTrue(request.query):
      if (priority != 'HIGH' && priority != 'MEDIUM' && priority != 'LOW') {
        response.status(400)
        response.send('Invalid Todo Priority')
      } else {
        sqlQuery = `SELECT * FROM todo WHERE priority = '${priority}';`
        data = await db.all(sqlQuery)
        response.send(data.map(everyItem => conversion(everyItem)))
      }
      break
    case hasCategoryTrue(request.query):
      if (category != 'WORK' && category != 'HOME' && category != 'LEARNING') {
        response.status(400)
        response.send('Invalid Todo Category')
      } else {
        sqlQuery = `SELECT * FROM todo WHERE category = '${category}';`
        data = await db.all(sqlQuery)
        response.send(data.map(everyItem => conversion(everyItem)))
      }
      break
    case hasCategoryAndPriority(request.query):
      if (priority == 'HIGH' || priority == 'MEDIUM' || priority == 'LOW') {
        if (
          category == 'WORK' ||
          category == 'HOME' ||
          category == 'LEARNING'
        ) {
          sqlQuery = `SELECT * FROM todo WHERE category = '${category}' AND priority = '${priority}';`
          data = await db.all(sqlQuery)
          response.send(data.map(everyItem => conversion(everyItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Category')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasCategoryAndStatus(request.query):
      if (status == 'TO DO' || status == 'IN PROGRESS' || status == 'DONE') {
        if (
          category == 'WORK' ||
          category == 'HOME' ||
          category == 'LEARNING'
        ) {
          sqlQuery = `SELECT * FROM todo WHERE category = '${category}' AND status = '${status}';`
          data = await db.all(sqlQuery)
          response.send(data.map(everyItem => conversion(everyItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Category')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case hasPriorityAndStatus(request.query):
      if (status == 'TO DO' || status == 'IN PROGRESS' || status == 'DONE') {
        if (priority == 'HIGH' || priority == 'MEDIUM' || priority == 'LOW') {
          sqlQuery = `SELECT * FROM todo WHERE priority = '${priority}' AND status = '${status}';`
          data = await db.all(sqlQuery)
          response.send(data.map(everyItem => conversion(everyItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.send(400)
        response.send('Invalid Todo Status')
      }
      break
    default:
      sqlQuery = `SELECT * FROM todo WHERE todo  LIKE '%${search_q}%'; `
      data = await db.all(sqlQuery)
      response.send(data.map(everyItem => conversion(everyItem)))
  }
})

// API -2

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const sql = `
  SELECT * FROM todo WHERE id = ${todoId};
  `
  const data = await db.get(sql)
  response.send(conversion(data))
})

// API - 3

app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  if (isValid(new Date(date))) {
    const sql = `
  SELECT * FROM todo WHERE due_date = '${date}';
  `
    const data = await db.all(sql)
    response.send(data.map(everyItem => conversion(everyItem)))
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

// API-4

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  if (status == 'DONE' || status == 'IN PROGRESS' || status == 'TO DO') {
    if (priority == 'HIGH' || priority == 'MEDIUM' || priority == 'LOW') {
      if (category == 'WORK' || category == 'HOME' || category == 'LEARNING') {
        if (isValid(new Date(dueDate))) {
          const sql = `
          INSERT INTO todo(id , todo , priority, status, category, due_date) VALUES (
            ${id} , '${todo}' ,'${priority}' , '${status}' , '${category}','${dueDate}'
          ); `
          await db.run(sql)
          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Status')
  }
})

// API-5

app.put('/todos/:todoId/', async (request, response) => {
  const {status, priority, todo, category, dueDate} = request.body
  const {todoId} = request.params
  if (status != undefined) {
    if (status == 'DONE' || status == 'IN PROGRESS' || status == 'TO DO') {
      const sql = `
          UPDATE todo
          SET  
          status = '${status}' 
          WHERE 
          id = ${todoId}
          `
      await db.run(sql)
      response.send('Status Updated')
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else if (priority != undefined) {
    if (priority == 'HIGH' || priority == 'MEDIUM' || priority == 'LOW') {
      const sql = `
          UPDATE todo
          SET  
          priority = '${priority}' 
          WHERE 
          id = ${todoId}
          `
      await db.run(sql)
      response.send('Priority Updated')
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
    }
  } else if (todo != undefined) {
    const sql = `
          UPDATE todo
          SET  
          todo = '${todo}' 
          WHERE 
          id = ${todoId}
          `
    await db.run(sql)
    response.send('Todo Updated')
  } else if (category != undefined) {
    if (category == 'WORK' || category == 'HOME' || category == 'LEARNING') {
      const sql = `
              UPDATE todo
              SET  
              category = '${category}' 
              WHERE 
              id = ${todoId}
              `
      await db.run(sql)
      response.send('Category Updated')
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
    }
  } else {
    if (isValid(new Date(dueDate))) {
      const sql = `
            UPDATE todo
            SET  
            due_date = '${dueDate}' 
            WHERE 
            id = ${todoId}
            `
      await db.run(sql)
      response.send('Due Date Updated')
    } else {
      response.status(400)
      response.send('Invalid Due Date')
    }
  }
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const sql = `
  DELETE FROM todo WHERE id = ${todoId};
  `
  await db.run(sql)
  response.send('Todo Deleted')
})

module.exports = app
