(function () {

if (!('crossOrigin' in new Image()) ||
        typeof Uint8ClampedArray === 'undefined' ||
        typeof Worker === 'undefined') {

    document.body.innerHTML = '<div class="icon alert center pad1">This demo doesn\'t work in your browser. ' +
            'Please try viewing it in Chrome, Firefox or Safari.</div>' +
            '<p class="center"><img src="upgradebrowser.gif" /></p>';
    return;
}

 var crs = new L.Proj.CRS.TMS(
     'EPSG:28992',
     '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +units=m +towgs84=565.2369,50.0087,465.658,-0.406857330322398,0.350732676542563,-1.8703473836068,4.0812 +no_defs',
     [-285401.92,22598.08,595401.92,903401.92], {
     resolutions: [3440.640, 1720.320, 860.160, 430.080, 215.040, 107.520, 53.760, 26.880, 13.440, 6.720, 3.360, 1.680, 0.840, 0.420, 0.21]
  })
  
  var map = L.map('map',{crs:crs, minZoom: 6, maxZoom: 13, fadeAnimation: false});
  map.addLayer(new L.Proj.TileLayer.TMS('http://geodata.nationaalgeoregister.nl/tiles/service/tms/1.0.0/opentopoachtergrondkaart/EPSG:28992/{z}/{x}/{y}.png',crs,{
    maxZoom: 14
    ,minZoom: 5,
    attribution: 'Background: &copy; <a href="http://pdok.nl">PDOK</a> OSM-elements: &copy; OSM contributors'
}));  
/*  map.addLayer(new L.Proj.TileLayer.TMS('http://geoserver.nl/tiles/tilecache.aspx/1.0.0/nlbagtopo_xl/{z}/{x}/{y}.png?layer=nlbagtopo_xl',crs,{
    maxZoom: 14
    ,minZoom: 12
    , attribution: 'Buildings: &copy; <a href="http://maps.geodan.nl">Geodan</a>'
})); 
*/
  /*map.addLayer(new L.Proj.TileLayer.TMS(' http://services.geodan.nl/tms/1.0.0/topokaart_EPSG28992/{z}/{x}/{y}.png', crs, {
    maxZoom: 14
    ,minZoom: 5
}));  */
 /* map.addLayer(new L.Proj.TileLayer.TMS(' http://services.geodan.nl/tms/1.0.0/boomregister_EPSG28992/{z}/{x}/{y}.png', crs, {
    maxZoom: 14
    ,minZoom: 10,
    opacity: 0.4
    , attribution: 'Trees: &copy; <a href="http://www.boomregister.nl/">Boomregister</a>'
}));*/
map.setView([50.79497,5.92229],13);//zuid limburg
 var hash = L.hash(map);

var hills = L.tileLayer.canvas();
var altitude, azimuth, zFactor, shadows, highlights;

hills.redrawQueue = [];

var uniqueId = (function () {
    var lastId = 0;
    return function () {
        return ++lastId;
    };
})();

var workers = [];

function updateTile(e) {
    var ctx = contexts[e.data.id],
        imgData = ctx.createImageData(256, 256);

    var shades = new Uint8ClampedArray(e.data.shades);

    imgData.data.set(shades);
    ctx.putImageData(imgData, 0, 0);
}

for (var i = 0; i < 16; i++) {
    workers[i] = new Worker('worker.js');
    workers[i].onmessage = updateTile;
}

map.on('viewreset', function () {
    hills.redrawQueue = [];
    workers.forEach(function (worker) {
        worker.postMessage('clear');
    });
});


var contexts = {};


hills.drawTile = function(canvas, tilePoint, zoom) {
    var demImg = new Image(),
        ctx = canvas.getContext('2d'),
        demCtx, renderedZFactor,
        id = uniqueId();

    contexts[id] = ctx;

    function redraw() {
        var transferable = [],
            data = {id: id};

        if (renderedZFactor !== zFactor) {
            data.raster = demCtx.getImageData(0, 0, 256, 256).data.buffer;
            data.zFactor = zFactor;
            transferable.push(data.raster);
        }

        data.altitude = altitude;
        data.azimuth = azimuth;
        data.shadows = shadows;
        data.highlights = highlights;

        var workerIndex = (tilePoint.x + tilePoint.y) % workers.length;

        workers[workerIndex].postMessage(data, transferable);

        renderedZFactor = zFactor;
    }

    demImg.onload = function() {
        var c = document.createElement('canvas');
        c.width = c.height = 256;
        demCtx = c.getContext('2d');
        demCtx.drawImage(demImg, 0, 0);

        redraw();
        hills.redrawQueue.push(redraw);
    };

    demImg.crossOrigin = '*';
    var y = Math.pow(2,zoom) - tilePoint.y -1;
    
    demImg.src= 'https://saturnus.geodan.nl/mapproxy/maaiveld/tms/1.0.0/ahn2/nlgrid/'+zoom+'/'+tilePoint.x+'/'+y+'.png';
//    demImg.src = L.Util.template(
//        '/ahn2/{z}/{x}/{y}.png',
//        L.extend({z: zoom}, tilePoint));
}
  

hills.redrawTiles = function () {
    hills.redrawQueue.forEach(function(redraw) { redraw(); });
};

hills.addTo(map);


function get(id) {
    return document.getElementById(id);
}
var nu = new Date();

var beginjaar =  new Date(nu.getYear()+1900, 0, 1).getTime()
var eindjaar = new Date(nu.getYear()+1900, 11, 31).getTime()
$('#date').attr('min',beginjaar);
$('#date').attr('max',eindjaar);
 $('#date').val(nu.getTime());
 $('#time').val((nu.getHours()*60+nu.getMinutes()));
 $('#timeslider').hide();
 $('#dateslider').hide();
 
 $('#datumveld').click(function(){ $('#dateslider').toggle(); $('#timeslider').hide();})
 $('#timeveld').click(function(){ $('#dateslider').hide(); $('#timeslider').toggle();})
var play = true; 

var myReq;
$('#play').click(function(){

    if(play){
        $('#play').html('stop');
        $('#playhelp').html('Press stop to stop the animation');
        var start  = 0;
        //hier moet iets magisch gebeuren met time/date en timestamp
        var max = $('#date').attr('max');
        var min = $('#date').attr('min');    
        function step(timestamp) {
          
          
          var progress = parseInt($('#date').val())+60000;
          if (progress > max) {
               progress = min;
          }
          
          $('#date').val(progress);
          var date = new Date(progress);
          var h = date.getHours();
          var m = date.getMinutes();
          $('#time').val(h*60+m);
           if((m%30)==0) {
          updateValues();
         
          needsRedraw = true;         
          }
          myReq = requestAnimationFrame(step);
        }
        
        myReq = requestAnimationFrame(step);
        play = false;
    } 
    else {
    $('#play').html('play');
    $('#playhelp').html('Press play to see the shadows move');
        window.cancelAnimationFrame(myReq);
        play = true;
    }
    
}); 

function updateValues() {
    var time = parseInt(get('time').value);
    var date = new Date(parseInt(get('date').value));
    
    date.setHours(Math.floor(time/60));
    date.setMinutes(time %60);
    $('#date').val(date.getTime());
    var minute = date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes();
    var timestring  = date.getHours()+':'+minute;
    var d = date.toDateString().split(' ');
    
    $('#dagveld').html(d[0]);
    $('#datumveld').html(d[2]+ ' '+d[1]);
  
    $('#timeveld').html(' ' + timestring +' ' );
    var sunInfo = SunCalc.getDayInfo(date, map.getCenter().lat, map.getCenter().lng);
    if(sunInfo.sunset.end.getTime() < date) {
     $('#timeveld').addClass('dark');
        $('#note').html("(after sunset)");
    }
    else if (sunInfo.sunrise.start.getTime() > date){
    $('#timeveld').addClass('dark');
         $('#note').html("(before sunrise)");
    }
    else {
    $('#timeveld').removeClass('dark');
         $('#note').html("&nbsp;");
    }
    altitude = SunCalc.getSunPosition(date, map.getCenter().lat, map.getCenter().lng).altitude;
    azimuth = SunCalc.getSunPosition(date, map.getCenter().lat, map.getCenter().lng).azimuth;
    zFactor = 0.12;//parseFloat(get('zfactor').value);
    shadows = 0.45;//parseFloat(get('shadows').value);
    highlights = 0.45;//parseFloat(get('highlights').value);
}

updateValues();



(function() {
    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                                window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;
})();

var needsRedraw = false;

function redraw() {
    if (needsRedraw) {
        hills.redrawTiles();
    }
    needsRedraw = false;

    window.requestAnimationFrame(redraw);
}

redraw();

[].forEach.call(document.querySelectorAll('#content input'), function (input) {
    input['oninput' in input ? 'oninput' : 'onchange'] = function (e) {
        updateValues();
        needsRedraw = true;
    };
});

})();
