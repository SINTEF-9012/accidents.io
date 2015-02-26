
# [![Accidents.io](http://accidents.io/medias/resize/728/800/17be037aa4f312eec7cb4442a692b994c01feab6.png)](http://accidents.io/)

Accidents.io is a web mobile application for mapping and reviewing accidents. It has been developed in the context of the UTMOST project.

### Datasources

Accidents.io has been made for integrating different sources of information. Datasources such as Twitter are real-time while other are simply tabular documents.

#### User submitted reports

The main source of information are the reports directly published by the users through the application.

#### Twitter

Tweets about accidents are imported in real-time, using the [Twitter Streaming API](https://dev.twitter.com/streaming/overview). Further analyses can be done through advanced solution such as [Reador.net](http://www.reador.net/).

#### AftenPosten Sykkelpatruljen

The Norwegian AftenPosten newspaper provided us a dataset from their [Sykkelpatruljen](http://www.osloby.no/nyheter/sykkelpatruljen/) application.

### Bing Accidents

Microsoft Bing provides [an API for retrieving traffic incidents information.](https://msdn.microsoft.com/en-us/library/hh441726.aspx)

## User guide

![Screenshot of the map view](http://accidents.io/medias/resize/728/800/3e4365303d8100791873dd7ccb7fbf1a2fae9be5.png)

### StreetView mode
![Streetview](http://accidents.io/medias/resize/728/800/aefa51d30a9e3748b46d99c5b829a5e21d6dcb67.png)

### Accident report interface
![Screenshot of the accident report interface](http://accidents.io/medias/resize/728/800/1f6c1c201785da5fc31f9b6f687ce4b029fa4a03.png)

### Accident report visualization
![Screenshot of the accident visualization](http://accidents.io/medias/resize/728/800/aac6ea7696bf2ad24305c5a731d99edce0f3b327.png)

### Map drawing mode
![Paint](http://accidents.io/medias/resize/728/800/b6539a7cc6e95f47d458a59d10d2e8be917a9c47.png)


## Technology

Accidents.io is based on MASTER from [the BRIDGE project](http://www.bridgeproject.eu/en). It's a HTML5 application which can be used on smartphones, tablets and desktop computers.

### The technologies used

|Technology|Purpose|
|----------|-------|
|[AngularJS](https://angularjs.org/)|Main framework of the web application|
|[ThingModel](https://github.com/SINTEF-9012/ThingModel)|Middleware synchronizing the data|
|[MapBoxAPI](http://mapbox.com/)|Map provider, based on [OpenStreetMap](http://openstreetmap.org/)|
|[Leaflet.js](http://leafletjs.com/)|Interactive map library|
|[PruneCluster](https://github.com/SINTEF-9012/PruneCluster)|Plugin for Leaflet, providing support of large and live datasets|
|[Google Street View](https://developers.google.com/maps/documentation/streetview/)|Interactive panoramic views of the streets in the world|
|[Caracal](https://github.com/SINTEF-9012/Caracal)|Multimedia backend server|
|[Bing Maps APIs](http://www.microsoft.com/maps/choose-your-bing-maps-API.aspx)|Satellite views and incident stream|
|[Nokia Here APIs](https://developer.here.com/)|Geocoding and reverse geocoding|
|[Twitter Streaming API](https://dev.twitter.com/streaming/overview)|Live stream of tweets|

## Opportunities of further developments

Accidents.io has been made as a proof of concept, to test various technologies and APIs. Advanced usages of the application are not explored.
