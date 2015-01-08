/* globals window, _, VIZI */
(function() {
  "use strict";

/**
 * Blueprint data input
 * @author Tapani Jämsä - playsign.net
 */  

  VIZI.BlueprintInputData = function(options) {
    var self = this;

    VIZI.BlueprintInput.call(self, options);

    _.defaults(self.options, {});

    // Triggers and actions reference
    self.triggers = [
      {name: "initialised", arguments: []},
      {name: "dataReceived", arguments: ["dataJSON"]}
    ];

    self.actions = [
      {name: "requestData", arguments: []}
    ,{
        name: "updateOverpassPath",
        arguments: []
      }
    ];
  };

  VIZI.BlueprintInputData.prototype = Object.create( VIZI.BlueprintInput.prototype );

  // Initialise instance and start automated processes
  VIZI.BlueprintInputData.prototype.init = function() {
    var self = this;
    self.emit("initialised");
  };
  
  //use for updating path for Overpass request
  VIZI.BlueprintInputData.prototype.updateOverpassPath = function(newPath)  {
    var self = this;
    self.options.path = self.options.globalData.overpassInputPath();
  };
    
  VIZI.BlueprintInputData.prototype.requestData = function() {
    var self = this;

    if (!self.options.path) {
      throw new Error("Required path option missing");
    }

    var onJsonReceived = function(data) {
      // JSON to array

      function json2array(json) {
        var result = [];
        var keys = Object.keys(json);
        keys.forEach(function(key) {
          result.push(json[key]);
        });
        return result;
      }

      var rootObj;
      var arr;

      // Get root and force it to array (because vizi seems to need an array)
      for (var p in data) {
        if(p == "osm3s"){
          // open streetmap copyright and version info
          continue;
        }
        if (Array.isArray(data)) {
          arr = data;
          break;
        } else if (Array.isArray(data[p])) {
          arr = data[p];
          break;
        } else if (Object.prototype.toString.call(data[p]) === '[object Object]') { // if object
          rootObj = data[p];
          break;
        }
      }

      if (arr === undefined && rootObj === undefined) {
        throw new Error("JSON doesn't have a data object");
      }

      if (!arr) {
        arr = json2array(rootObj);
      }
      data.data = arr;

      console.log("Data received: "+self.options.path);

      self.emit("dataReceived", data);

      // Repeat
      if (self.options.repeat) {
        window.setTimeout(function() {
          self.emit("requestData", "repeat");
        }, self.options.repeatRate);
      }
    };
    var retryCount = 0;
    var onJsonError = function(xhr, textStatus, exc) {
        console.log("radial search json request error: " + textStatus);
        if (textStatus === "timeout" && retryCount++ < 5) {
            $.ajax(ajaxParams, onJsonReceived);            
        }
    };
    // Request data
    var ajaxParams = {
        url: self.options.path,
        dataType: 'json',
        success: onJsonReceived,
        error: onJsonError,
        timeout: 5000
    };
    $.ajax(ajaxParams, onJsonReceived);
    
  };

}());
