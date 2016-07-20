using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Dice.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            ViewBag.AppName = "Dice !";
            ViewBag.Title = "Dice Manager";
            return View("Index");
        }
    }
}