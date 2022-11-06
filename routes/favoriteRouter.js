const express = require("express");
const authenticate = require("../authenticate");
const cors = require("./cors");
const Favorite = require("../models/favorite");
const favoriteRouter = express.Router();

favoriteRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorite.find({ user: req.user._id })
      .populate("user")
      .populate("campsites")
      .then((favorites) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(favorites);
      })
      .catch((err) => next(err));
  })

  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id })
      .then((favorite) => {
        if (favorite) {
          req.body.forEach((ele) => {
            if (!favorite.campsites.includes(ele._id)) {
              favorite.campsites.push(ele._id);
            }
          });
          favorite
            .save()
            .then((favorite) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(favorite);
            })
            .catch((err) => next(err));
        } else {
          Favorite.create({ user: req.user_id })
            .then((favorite) => {
              req.body.forEach((ele) => {
                favorite.campsites.push(ele._id);
              });
              favorite
                .save()
                .then((favorite) => {
                  res.statusCode = 200;
                  res.setHeader("Content-Type", "application/json");
                  res.json(favorite);
                })
                .catch((err) => next(err));
            })
            .catch((err) => next(err));
        }
      })
      .catch((err) => next(err));
  })

  .put(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res) => {
      res.statusCode = 403;
      res.end("PUT operation not supported");
    }
  )

  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOneAndDelete({ user: req.user._id })
      .then((favorite) => {
        res.statusCode = 200;
        if (favorite) {
          res.setHeader("Content-Type", "application/json");
          res.json(favorite);
        } else {
          res.setHeader("Content-Type", "text/plain");
          res.end("You do not have any favorites to delete");
        }
      })
      .catch((err) => next(err));
  });

favoriteRouter
  .route("/:campsiteId")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    res.statusCode = 403;
    res.end("GET operation not supported");
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id })
      .then((favorite) => {
        if (favorite) {
////////// FIX 1.1 & 2: Two things. First, "req.params.campsiteId" is a string, not an object. So, there is no "_id" property -- we can just use it as is.
// Second, you left an 'r' off of "req" in the paqrameter list for the array push method.
// OLD CODE:
/*
          if (!favorite.campsites.includes(req.params.campsiteId._id)) {
            favorite.campsites.push(eq.params.campsiteId._id);
*/
            if (!favorite.campsites.includes(req.params.campsiteId)) {
                favorite.campsites.push(req.params.campsiteId); 
////////// END FIX 1.1 & 2
                favorite.save()
                .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(favorite);
                })
                .catch((err) => next(err));
          }
////////// FIX 3: We should have an ELSE here that returns a message to the user that the campsite ID they submitted was already a favorite.
// We did not do that in the "/favorites" POST because we were dealing with a whole array of campsite IDs. We can here since we are dealing with only a single ID.
          else {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain');
            res.end('That campsite is already a favorite!');
          }
////////// END FIX 3
        } else {
////////// FIX 1.2 & NOTE: As above, you don't need to try and access an "_id" property on "req.params.campsiteId" as it is a string, not an object.
// Now the note. Your code method here works just fine (once you remove the "._id" from "req.params.campsiteId._id"), but there is an easier way to notate all this.
// Because we are only dealing with a single campsite ID in a blank favorite document, we can set up the new favorite document in one line like this...
// OLD CODE:
/*
          Favorite.create({ user: req.user_id })
            .then((favorite) => {
              favorite.campsites.push(req.params.campsiteId._id);
              favorite.save().then((favorite) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(favorite);
              });
            })
            .catch((err) => next(err));
*/
            Favorite.create({ user: req.user._id, campsites: [req.params.campsiteId] })
            .then(favorite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            })
            .catch(err => next(err));
////////// END FIX 1.2 & NOTE
        }
      })
      .catch((err) => next(err));
  })

  .put(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res) => {
      res.statusCode = 403;
      res.end("PUT operation not supported");
    }
  )
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id })
      .then((favorite) => {
        if (favorite) {
////////// FIX 4: The filter method is a good choice. Just remember that filter returns a NEW array. So,
// in order for this to work, you have to replace the existing "favorite.campsites" array with the new array from the
// filter operation. We can do it with a simple assignment. Also, there's another instance here of you adding "._id" onto
// "req.params.campsiteId". It's not necessary because "req.params.campsiteId" is not an object.
// OLD CODE:
/*
          favorite.campsites.filter((ele) => {
            req.params.campsiteId._id != ele;
          });
*/
        favorite.campsites = favorite.campsites.filter((ele) => {
            req.params.campsiteId !== ele.toString(); // We use ".toString()" in order to make sure that each Object ID in the favorite.campsites array matches the data type of "req.params.campsiteId".
        });
////////// END FIX 4
          favorite.save().then((favorite) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(favorite);
          })
////////// FIX 5: You need a "catch" for your "then"
          .catch(err => next(err));
////////// END FIX 5
        } else {
////////// FIX 6: You forgot to set your status code.
          res.statusCode = 200;
////////// END FIX 6
          res.setHeader("Content-Type", "text/plain");
          res.end("You do not have any favorites to delete");
        }
      })
      .catch((err) => next(err));
  });

module.exports = favoriteRouter;
