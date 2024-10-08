require('dotenv').config();

//Import dependencies
const express = require("express")
const mysql = require('mysql')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const ejs = require('ejs')

const app = express() //express server function
const port = 3000 //express server port

//Middleware
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(express.static('public'))
app.use(cookieParser())
app.set('view engine', 'ejs')
//API routes
app.get('/', (req, res)=>{
    res.render('agentlog', {message: ""})
})
app.get('/agent/dashboard', (req, res)=>{
    if(req.cookies.jwt){
        const verify = jwt.verify(req.cookies.jwt,
          process.env.secret_key)
          res.render('agentdashboard.ejs', {username:verify.username})

      }
      else{
        res.redirect('/')
      }
})
app.get('/agent/dashboard/new_lead', (req, res)=>{
  if(req.cookies.jwt){
    const verify = jwt.verify(req.cookies.jwt,
      process.env.secret_key)
      res.render('newlead.ejs', {message: ""})

  }else{
    res.redirect('/agent/dashboard')
  }
})
app.get('/logout', (req, res)=>{
    res.cookie("jwt", "", {maxAge: 1})
    res.redirect('/')
})

//End API routes


//Agent Login Authentication
app.post('/agent', (req, res)=>{
    const user = {
        username: process.env.userAgent,
        password: process.env.userAgentPassword
    }
    const token = jwt.sign({username: user.username}, 
      process.env.secret_key)
      res.cookie('jwt', token,{
        maxAge: 600000,
        httpOnly: true
      })
    const databaseConnection = mysql.createConnection({
        user: req.body.username,
        password: req.body.password,
        database: process.env.userDB,
        host: process.env.userHost,
        port: process.env.userPort
    })
    databaseConnection.connect((err)=>{
        if(err){
            console.log(err)
            const message = "Access Denied!!!"
            res.render('agentlog.ejs', {message})

        }
        else{
              res.cookie('jwt', token,{
                maxAge: 600000,
                httpOnly: true
              })
              res.redirect('/agent/dashboard')
        }
    })
})

//Add new lead
app.post('/new_lead', (req, res)=>{
  const databaseConnection = mysql.createConnection({
    user: process.env.userAgent,
    password: process.env.userAgentPassword,
    database: process.env.userDB,
    host: process.env.userHost,
    port: process.env.userPort
})
databaseConnection.connect((err)=>{
  if(!err){
    databaseConnection.query('select * from leads where Email = ?',
      [req.body.email], (err, result)=>{
      if(!err){
        if(result.length > 0){
          const message = "A lead with the provided email already exist!"
          res.render('newlead.ejs', {message})

        }else{
          const date = new Date()
          const datenow = date.toISOString().slice(0, 10)
          databaseConnection.query
          ('insert into leads(Lead_Detail_Name, Email, \
            Submission_Date, Phone_Number)values(?,?,?,?)',
            [req.body.leadFullName, req.body.email, datenow, req.body.phone],
             (err)=>{
              if(!err){
                const message = "A new lead added successfully"
                res.render('newlead.ejs', {message})

              }
            })
        }
      }
    })
  }
})
})

//Retrieve all leads records
app.get('/agent/dashboard/leads',(req, res)=>{
  const databaseConnection = mysql.createConnection({
    user: process.env.userAgent,
    password: process.env.userAgentPassword,
    database: process.env.userDB,
    host: process.env.userHost,
    port: process.env.userPort
  })
  databaseConnection.connect((err)=>{
    if(!err){
      databaseConnection.query('select * from leads', (err, result)=>{
      if(err) throw err
      res.json(result)
     })
    }
  })

})
// app.get('/leads/:id', (req, res)=>{
//   const databaseConnection = mysql.createConnection({
//     user: process.env.userAgent,
//     password: process.env.userAgentPassword,
//     database: 'mydatabase',
//     host: 'localhost',
//     port: 3307
//   })
//   databaseConnection.connect((err)=>{
//     if(!err){
//       databaseConnection.query('delete from leads where id = ?', [req.params.id], (err)=>{
//         if(!err){
//           res.send(`A lead with id ${req.params.id} has been deleted`)
//         }else{
//           res.send("Unable to delete lead")
//         }
//       })
//     }

//   })

// })

app.listen(port, ()=>console.log(`Server is listening to port ${port}`))