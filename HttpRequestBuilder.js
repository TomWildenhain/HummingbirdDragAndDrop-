/**
 * Created by Tom on 6/12/2017.
 */

/**
 * Represents a request to be used with HtmlServer
 * @param url {String} - The beginning of the request
 * @constructor
 */
function HttpRequestBuilder(url){
	DebugOptions.validateNonNull(url);
	this.request = url;
	this.hasFirstParam = false;
}
/**
 * Adds a get parameter with the given key and value
 * @param key {String}
 * @param value {String} - The value will be escaped with
 */
HttpRequestBuilder.prototype.addParam = function(key, value){
	if(!this.hasFirstParam){
		this.hasFirstParam = true;
		this.request += "?";
	} else{
		this.request += "&";
	}
	this.request += key;
	this.request += "=";
	this.request += HtmlServer.encodeHtml(value);
};
/**
 * Returns the request to give to HtmlServer
 * @returns {String}
 */
HttpRequestBuilder.prototype.toString = function(){
	return this.request;
};

