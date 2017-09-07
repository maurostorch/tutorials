package com.croogloo.tests;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;

public class LoginServlet extends HttpServlet {

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		UserService userSerivce = UserServiceFactory.getUserService();
		
		if (userSerivce.isUserLoggedIn()) {
			req.getSession().setAttribute("username", userSerivce.getCurrentUser().getUserId());
			req.getSession().setAttribute("email", userSerivce.getCurrentUser().getEmail());
			
			resp.getWriter().write("logged");
		} else {
			
			resp.sendRedirect(userSerivce.createLoginURL("/login"));
		}
		
	}
	
}
