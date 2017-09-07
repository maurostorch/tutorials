package com.croogloo.tests;

import java.util.ArrayList;
import java.util.List;

import com.google.api.server.spi.auth.common.User;
import com.google.api.server.spi.config.AnnotationBoolean;
import com.google.api.server.spi.config.Api;
import com.google.api.server.spi.config.ApiMethod;
import com.google.api.server.spi.config.Named;

/**
  * Add your first API methods in this class, or you may create another class. In that case, please
  * update your web.xml accordingly.
 **/
@Api(name = "authtest",
     version = "v1",
     defaultVersion = AnnotationBoolean.TRUE,
     authenticators = {CustomTokenAuthenticator.class})
public class YourFirstAPI {
	
	@ApiMethod(path="info", httpMethod=ApiMethod.HttpMethod.GET)
	public List<String> getInfo(User user, @Named("name") String name) {
		List<String> l = new ArrayList<String>();
		if (name!=null) {
			//l.add("Tokened by:"+user.getEmail());
			l.add("token "+name);
		}
		l.add("always:"+name);
		return l;
	}
	
}
