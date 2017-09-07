package com.croogloo.tests;

import java.util.logging.Logger;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;

import org.slf4j.LoggerFactory;

import com.google.api.server.spi.ServiceException;
import com.google.api.server.spi.auth.common.User;
import com.google.api.server.spi.config.Authenticator;

public class CustomTokenAuthenticator implements Authenticator{
	
	public static Logger log = Logger.getLogger("CustomTokenAuthenticator");

	@Override
	public User authenticate(HttpServletRequest req) throws ServiceException {
		log.info("Token authentication");
		log.info("Remote address:"+req.getRemoteAddr());
		if (req!=null && req.getParameter("token")!=null) {
			return isTokenValid((String)req.getParameter("token"));
		}
		return null;
//		if (req != null) {
//			if (req.getCookies()!=null) {
//				for (Cookie c : req.getCookies()) {
//					log.info("Cookie "+c.getName()+" : "+c.getValue());
//				}
//			}
//		} else {
//			log.warning("request is null in CustomTokenAuthenticator");
//		}
//		if (req.getSession(false)!=null && req.getSession(false).getAttribute("username") != null) {
//			log.info("LOGGED IN AS:"+req.getSession(false).getAttribute("username"));
//			return new User((String)req.getSession(false).getAttribute("username"), (String)req.getSession(false).getAttribute("email"));
//		} else {
//			if (req.getHeader("X-Croogloo-Token")!=null && req.getHeader("X-Croogloo-Token").equals("123")) {
//				return new User("a@b.com");
//			}
//			log.warning("session is new "+req.getSession(false));
//			
//		}
//		return null;
	}
	
	private User isTokenValid(String token) {
		if (token.equals("123")) {
			return new User("user1", "user1@croogloo.com");
		}
		return null;
	}

}
