package com.croogloo.tests;

import java.io.FileInputStream;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.net.URLEncoder;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.logging.Logger;

import org.apache.commons.codec.binary.Base64;

import com.google.api.server.spi.config.Api;
import com.google.api.server.spi.config.ApiMethod;
import com.google.api.server.spi.config.Named;
import com.google.auth.oauth2.ServiceAccountCredentials;

/**
 * API KEY 
 * @author maurostorch
 *
 */

@Api(name="fileAPI",
		version="v1")
public class FilesAPI {
	
	public static Logger log = Logger.getLogger("FilesAPI");
	static final String BASE_GCS_URL = "https://storage.googleapis.com";
	static final String BUCKET = "/copiar-colar.appspot.com/";
	static final String GOOGLE_ACCESS_ID = "signedurls@copiar-colar.iam.gserviceaccount.com";
	static final long lifetimeinseconds = 365 * 86400; // 365 = 1 year
	
	@ApiMethod(path="sign")
	public List<String> signURL(@Named("filename") String filename) throws Exception{
		List<String> _r = new ArrayList<String>();
		String expire = (Calendar.getInstance().getTime().getTime()+lifetimeinseconds)+"";
		String fullURL = BASE_GCS_URL + BUCKET + filename;
		String tosign = "GET" +	"\n" +
						"" + "\n" +
						"" + "\n" +
						expire + "\n" +
						BUCKET + filename;
		log.info("tosign = "+tosign);
		try {
			PrivateKey pk = getPrivateKey();
			Signature sign = Signature.getInstance("SHA256withRSA");
			sign.initSign(pk);
			sign.update(tosign.getBytes("UTF-8"));
			String signedurl = new String(Base64.encodeBase64(sign.sign()));
			signedurl = URLEncoder.encode(signedurl,"UTF-8");
			String theSignedURL = fullURL + 
								"?GoogleAccessId=" + GOOGLE_ACCESS_ID +
								"&Expires=" + expire +
								"&Signature=" + signedurl;
			log.info("THE SIGNED URL = "+theSignedURL);
			_r.add(theSignedURL);
		} catch (Exception e) {
			log.severe(e.getMessage());
			StringWriter sw = new StringWriter();
			e.printStackTrace(new PrintWriter(sw));
			log.severe(sw.getBuffer().toString());
			throw e;
		}
		return _r;
	}
	
	
	private PrivateKey getPrivateKey() throws Exception {
		ServiceAccountCredentials credentials = ServiceAccountCredentials.fromStream(new FileInputStream("Copiar Colar-9718de0724f7.json"));
		return credentials.getPrivateKey();
	}
	
	
	

}
