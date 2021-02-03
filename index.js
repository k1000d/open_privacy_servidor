const express = require("express");
const app = express();
const MongoClient = require("mongodb").MongoClient;
const passport = require("passport");
var cors = require("cors");
app.use(cors());
let db;
//Nos conectamos a la base de datos
MongoClient.connect("mongodb://localhost:27017", function (err, client) {
    if (err !== null) {
        console.log(err);
    } else {
        db = client.db("openprivacy");
    }
});
const session = require("express-session");
app.use(
    session({
        secret: "secret",
        resave: false,
        saveUninitialized: false,
    })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.static("public"));
const LocalStrategy = require("passport-local").Strategy;
passport.use(
    new LocalStrategy(
        {
            usernameField: "email",
        },
        function (email, password, done) {
            db.collection("clientes")
                .find({ email: email })
                .toArray(function (err, users) {
                    if (users.length === 0) {
                        done(null, false);
                    }
                    const user = users[0];
                    if (password === user.password) {
                        return done(null, user);
                    } else {
                        return done(null, false);
                    }
                });
        }
    )
);
passport.serializeUser(function (user, done) {
    done(null, user.email);
});
passport.deserializeUser(function (id, done) {
    db.collection("clientes")
        .find({ email: id })
        .toArray(function (err, users) {
            if (users.length === 0) {
                done(null, null);
            }
            done(null, users[0]);
        });
});
app.post(
    "/api/login",
    passport.authenticate("local", {
        successRedirect: "/api",
        failureRedirect: "/api/fail",
    })
);
app.get("/api/fail", function (req, res) {
    res.status(401).send({ mensaje: "denegado" });
});
app.get("/api", function (req, res) {
    if (req.isAuthenticated() === false) {
        return res.status(401).send({ mensaje: "necesitas loguearte" });
    }
    res.send({ mensaje: "logueado correctamente", cliente: req.user});
});
app.post("/api/register", function (req, res) {
    db.collection("clientes").find({
        email: req.body.email
    }).toArray(function (err, cliente) {
        if (cliente.length > 0) {
            res.send({ mensaje: "Ya existe" })
        } else {
            db.collection("clientes").insertOne(
                {
                    name: req.body.nombre,
                    email: req.body.email,
                    password: req.body.password,
                },
                function (err, datos) {
                    if (err !== null) {
                        res.send(err);
                    } else {
                        res.send({ mensaje: "Registrado" });
                    }
                }
            )
        }
    })
    
}
);

//crear una ruta para traer la colleccion
app.get("/clientes", function(req, res){
    db.collection("clientes").find().toArray(function(err, datos){
        if (err !== null) {
            res.send(err);
        }else{
            res.send(datos);
        }
    });
})
app.get("/clientes/:nombre", function(req, res){
    let nombre = req.params.nombre
    db.collection("clientes").find({nombre:nombre}).toArray(function(err, datos){
        if (err !== null) {
            res.send(err);
        }else{
            res.send(datos);
        }
    });
})
/*
// vamos a hacer un registro de usuario.
//esto nos permite acceder al body de la petición.
//app.use(express.json());

const session = require("express-session");
app.use(
    session ( {
            secret: "secret",
            resave: false,
            saveUninitialized: false,
        })
    );

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.static("public"));


const LocalStrategy = require("passport-local").Strategy;
// una nueva clase 

passport.use(
new LocalStrategy(
    {
        usernameField: "email",
    },
    function (email, password, done){
        db.collection("clientes")
        .find({email: email})
        .toArray(function(err, users){
            if (users.length === 0){
                done(null, false);
            }
            const user= users[0];
            if (password === user.password){
                return done(null, user);
            }else {
                return done(null, false);
            }
        })
    }
   )
);
//esto seria lo que le llega de localStrategy.
passport.serializeUser(function(user, done){
    done(null, user.email);
});
//al id le llegara el email porque lo hemos puesto en usernameField
passport.deserializeUser(function(id, done){
    db.collection("clientes")
    .find({email: id})
    .toArray(function(err, users){
        if (users.length === 0){
            done(null, null);
        }
        done(null, users[0]);
    });
});
//no me sale // no me salia porque no habia puesto app.use(express.static("public")); y passport.use y user en vez de id en passport.serializeUser(function(user, done)
app.post("/api/login",
    passport.authenticate("local", {
        successMessage: "/api",
        failureRedirect: "/api/fail",
    })
);
//Cuando no funciona
app.get("/api/fail", function (req, res) {
    res.status(401).send({mensaje: "denegado" });
}); 

app.get("/api", function(req, res){
    if(req.isAuthenticated() === false){
      return res.status(401).send({mensaje: "necesitas loguearte nuevamente"})
     
    }
    res.send({mensaje: "logueado correctamente", usuario:req.user});
});





app.post("/api/register", function(req, res){
    db.collection("clientes").insertOne(
        {
            name: req.body.nombre,
            email: req.body.email,
            password: req.body.password,
            dirección: req.body.dirección,

        },
        function(err, datos){
            if (err !== null) {
                res.send(err);
            }else {
                res.send({mensaje: "registrado"});
            }
        }
    )
});

app.get("/api/user", function (req, res){
    if(req.isAuthenticated()){
      return res.send ({ nombre: req.user.name});
    }
    res.send ({nombre: "No logueado"});

    
});
*/
app.listen(3000);
