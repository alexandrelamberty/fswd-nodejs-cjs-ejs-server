require("dotenv").config();
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const url = require("node:url");
const ejs = require("ejs");

const hostname = process.env.HOST;
const port = process.env.PORT;

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

const routes = [
  {
    path: "/",
    view: "home",
    name: "Home",
    data: {
      nav: nav,
      intro: "Welcome to my website.",
    },
  },
  {
    path: "/about",
    view: "about",
    name: "About",
    data: {
      nav: nav,
      intro: "",
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
    name: "Contact",
    data: {
      nav: nav,
    },
  },
];

const server = http.createServer(routeHandler);

function routeHandler(req, res) {
  console.log("Request.url: ", req.url);

  const requestRoute = req.url.split("?")[0];

  const route = routes.find((element) => {
    return element.path === requestRoute;
  });

  if (route) {
    if (req.method === "GET") {
      // Render the route
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
    console.log("Request after: ", req.url);

    const requestUrl = url.parse(req.url).pathname;
    const filePublic = path.resolve("public" + requestUrl);

    console.log("Resource: ", filePublic);

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
      // FIXME: bad design, extract ?
      render(res, "null");
    }
  }
}

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

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
