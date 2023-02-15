require("dotenv").config();
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const url = require("node:url");
const ejs = require("ejs");

const hostname = process.env.HOST;
const port = process.env.PORT;

// The global navigation links
const nav = [
  {
    title: "Home",
    link: "/",
  },
  {
    title: "About",
    link: "/about",
  },
  {
    title: "Contact",
    link: "/contact",
  },
];

//
const routes = [
  {
    path: "/", // The path for the route
    view: "home", // The ejs template to render
    // The data to inject into the template
    data: {
      nav: nav, // :( need to inject the nav here to passe it the header partial
      // that is included in every pages.
      name: "Home", // The page title
      intro: "Welcome to my website.",
    },
  },
  {
    path: "/about",
    view: "about",
    data: {
      nav: nav,
      title: "About",
      intro: "",
      picture: "images/6729065.jpeg",
      name: "Alexandre Lamberty",
      gender: "male",
      country: "Belgium",
      birthdate: new Date("1983-08-10"),
      courses: ["Philosophy", "Computer science", "Biology"],
    },
  },
  {
    path: "/contact",
    view: "contact",
    data: {
      nav: nav,
    },
  },
];

const server = http.createServer(routeHandler);

/**
 * Handle the server requests.
 * @param {*} req The http request
 * @param {*} res The http response
 * @returns void
 */
function routeHandler(req, res) {
  // Extract only the path of the url
  const requestUrl = url.parse(req.url).pathname;

  // Look for a corresponding route
  const route = routes.find((element) => {
    return element.path === requestUrl;
  });

  // If we have a match, we check the HTTP method and render the view or process
  // the post data.
  if (route) {
    if (req.method === "GET") {
      render(res, route);
    } else if (req.method === "POST") {
      req.on("data", (form) => {
        console.log("Form data: ", form);
      });
      req.on("end", () => {
        res.writeHead(301, {
          Location: "/",
        });
        res.end();
      });
    }
  } else {
    // If we don't have a match for the route, we check if it is resource file.
    const requestUrl = url.parse(req.url).pathname;
    const filePublic = path.resolve("public" + requestUrl);
    if (fs.existsSync(filePublic)) {
      const file = fs.readFileSync(filePublic);
      const extension = path.extname(filePublic).replace(".", "");
      let contentType = "";
      if (
        ["gif", "png", "jpeg", "jpg", "bmp", "webp", "svg"].includes(extension)
      ) {
        contentType = "image/" + extension;
      } else if (extension === "css") {
        contentType = "text/css";
      }
      res.writeHead(200, {
        "Content-type": contentType,
      });
      res.end(file);
      return;
    } else {
      // Nothing to render so we throw a 404 by rendering nothing
      render(res, "null");
    }
  }
}

/**
 * Render an html view corresponding to a route.
 * It use the fs to check if the view exist and then use EJS the render the file.
 * If the view doesn't exist it render a 404 page.
 * @param {*} res The http response
 * @param {*} route The route to render
 */
function render(res, route) {
  console.log("Render: ", route.view);
  fs.stat(`./views/${route.view}.ejs`, (err, stats) => {
    res.setHeader("Content-Type", "text/html");
    if (stats) {
      res.statusCode = 200;
      const filename = path.resolve("views", `${route.view}.ejs`);
      ejs.renderFile(filename, route.data, (err, render) => {
        if (err) {
          console.log(err);
          return;
        }
        res.writeHead(200, {
          "Content-type": "text/html",
        });
        res.end(render);
      });
    } else {
      res.statusCode = 404;
      const filename = path.resolve("views", `not-found.ejs`);
      ejs.renderFile(filename, { nav }, (err, render) => {
        if (err) {
          console.log(err);
          return;
        }
        res.writeHead(200, {
          "Content-type": "text/html",
        });
        res.end(render);
      });
    }
  });
}

// Start the server on the specified port and hostname.
// See the .env file and the package.json scripts.
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
