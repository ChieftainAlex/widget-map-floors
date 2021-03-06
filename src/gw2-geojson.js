/**
 * Created by Smiley on 20.06.2016.
 */

/**
 * Class GW2GeoJSON
 */
class GW2GeoJSON{

	/**
	 * GW2GeoJSON constructor
	 *
	 * @param data
	 */
	constructor(data){
		this.data = data;
		this.featureCollections = {};
		this.viewRect = [[0, 0], [32768, 32768]];

		// todo
		this.layers = [
			'region_label', 'region_poly',
			'map_label', 'map_poly',
			'sector_label', 'sector_poly',
			'task_label', // 'task_poly',
			'heropoint_icon',
			'waypoint_icon',
			'landmark_icon',
			'vista_icon',
			'unlock_icon',
//			'camp', 'tower', 'keep', 'castle', 'ruins', 'generic', 'resource'
		];

		this.setView();

		this.layers.forEach(layer => this.featureCollections[layer] = new GeoJSONFeatureCollection());
	}

	/**
	 * @returns {GW2GeoJSON}
	 */
	setView(){

		if(this.data.continent_rect){
			this.viewRect = this.data.continent_rect;
		}
		else if(this.data.clamped_view){
			this.viewRect = this.data.clamped_view;
		}
		else if(this.data.texture_dims){
			this.viewRect = [[0, 0], json.texture_dims];
		}

		return this;
	}

	/**
	 * @returns {*}
	 */
	getData(){

		// a response to floors
		if(this.data.regions){
			this.continent(this.data.regions);
		}
		// a regions response
		else if(this.data.maps){
			this.region(this.data);
		}
		// an actual map response
		else if(this.data.points_of_interest){
			this.map(this.data);
		}

		Object.keys(this.featureCollections).forEach((f) => this.featureCollections[f] = this.featureCollections[f].getJSON());

		return {
			viewRect: this.viewRect,
			featureCollections: this.featureCollections,
		};

	}

	/**
	 * @param continent
	 * @returns {GW2GeoJSON}
	 */
	continent(continent){
//		console.log('continent', continent);

		Object.keys(continent).forEach(regionID => this.region(continent[regionID]));

		return this;
	}

	/**
	 * @todo https://github.com/arenanet/api-cdi/issues/336
	 *
	 * @param region
	 * @returns {GW2GeoJSON}
	 */
	region(region){
//		console.log('region', region);

		this.featureCollections.region_label.addFeature({
			name     : region.name,
			type     : 'region',
			layertype: 'label',
		}).setGeometry(region.label_coord);

		this.featureCollections.region_poly.addFeature({
			name     : region.name,
			type     : 'region',
			layertype: 'poly',
		}).setGeometry(new GW2ContinentRect(region.continent_rect).getPoly(), 'Polygon');

		Object.keys(region.maps).forEach(mapID => this.map(region.maps[mapID]));

		return this;
	}

	/**
	 * @todo https://github.com/arenanet/api-cdi/issues/334
	 *
	 * @param map
	 * @returns {GW2GeoJSON}
	 */
	map(map){
//		console.log('map', map);

		var rect = new GW2ContinentRect(map.continent_rect);

		this.featureCollections.map_label.addFeature({
			name          : map.name,
			default_floor : map.default_floor,
			min_level     : map.min_level,
			max_level     : map.max_level,
			type          : 'map',
			layertype     : 'label',
		}).setGeometry(rect.getCenter()).setID(map.id);

		this.featureCollections.map_poly.addFeature({
			name     : map.name,
			type     : 'map',
			layertype: 'poly',
		}).setGeometry(rect.getPoly(), 'Polygon').setID(map.id);

		this
			.sectors(map.sectors)
			.poi(map.points_of_interest)
			.task(map.tasks)
			.heropoint(map.skill_challenges)
		;

		return this;
	}

	/**
	 * @param sectors
	 * @returns {GW2GeoJSON}
	 */
	sectors(sectors){

		Object.keys(sectors).forEach(sectorId =>{
			var sector = sectors[sectorId];
//			console.log('sector', sector);

			this.featureCollections.sector_label.addFeature({
				name     : sector.name,
				chat_link: sector.chat_link,
				level    : sector.level,
				type     : 'sector',
				layertype: 'label',
			}).setGeometry(sector.coord).setID(sector.id);

			this.featureCollections.sector_poly.addFeature({
				name     : sector.name,
				type     : 'sector',
				layertype: 'poly',
			}).setGeometry([sector.bounds], 'Polygon').setID(sector.id);
		});

		return this;
	}

	/**
	 * @param pois
	 * @returns {GW2GeoJSON}
	 */
	poi(pois){
		var icons = {
			landmark: 'https://render.guildwars2.com/file/25B230711176AB5728E86F5FC5F0BFAE48B32F6E/97461.png',
			unlock  : 'https://render.guildwars2.com/file/943538394A94A491C8632FBEF6203C2013443555/102478.png', // dungeon icon
			vista   : 'https://render.guildwars2.com/file/A2C16AF497BA3A0903A0499FFBAF531477566F10/358415.png',
			waypoint: 'https://render.guildwars2.com/file/32633AF8ADEA696A1EF56D3AE32D617B10D3AC57/157353.png',
		};

		Object.keys(pois).forEach(poiID =>{
			var poi = pois[poiID];
//			console.log(poi);

			this.featureCollections[poi.type + '_icon'].addFeature({
				name     : poi.name || false,
				type     : poi.type,
				chat_link: poi.chat_link || false,
				layertype: 'icon',
				icon     : icons[poi.type],
			}).setGeometry(poi.coord).setID(poi.id || false);
		});

		return this;
	}

	/**
	 * @todo https://github.com/arenanet/api-cdi/issues/335
	 *
	 * @param tasks
	 * @returns {GW2GeoJSON}
	 */
	task(tasks){

		Object.keys(tasks).forEach(taskID =>{
			var task = tasks[taskID];
//			console.log(task);

			this.featureCollections.task_label.addFeature({
				name     : task.objective,
				chat_link: task.chat_link,
				level    : task.level,
				type     : 'task',
				layertype: 'icon',
				icon     : 'https://render.guildwars2.com/file/09ACBA53B7412CC3C76E7FEF39929843C20CB0E4/102440.png',
			}).setGeometry(task.coord).setID(task.id);

/*
			this.featureCollections.task_poly.addFeature({
				name     : task.objective,
				type     : 'task',
				layertype: 'poly',
			}).setGeometry(task.bounds, 'Polygon').setID(task.id);
*/
		});

		return this;
	}

	/**
	 * @todo https://github.com/arenanet/api-cdi/issues/329
	 *
	 * @param heropoints
	 * @returns {GW2GeoJSON}
	 */
	heropoint(heropoints){

		if(!heropoints.length){
			return this;
		}

		heropoints.forEach(heropoint =>{
//			console.log(heropoint);

			this.featureCollections.heropoint_icon.addFeature({
				coords   : heropoint.coord,
				type     : 'heropoint',
				layertype: 'icon',
				icon     : 'https://render.guildwars2.com/file/B4EC6BB3FDBC42557C3CAE0CAA9E57EBF9E462E3/156626.png',
			}).setGeometry(heropoint.coord);
		});

		return this;
	}

}

/**
 * Class GW2ContinentRect
 */
class GW2ContinentRect{

	/**
	 * GW2ContinentRect constructor
	 *
	 * @param continent_rect
	 */
	constructor(continent_rect){
		this.rect = continent_rect;
	}

	/**
	 * returns bounds for L.LatLngBounds()
	 *
	 * @returns {*[]}
	 */
	getBounds(){
		return [
			[this.rect[0][0], this.rect[1][1]],
			[this.rect[1][0], this.rect[0][1]]
		]
	}

	/**
	 * returns the center of the rectangle
	 *
	 * @returns {*[]}
	 */
	getCenter(){
		return [
			(this.rect[0][0] + this.rect[1][0]) / 2,
			(this.rect[0][1] + this.rect[1][1]) / 2
		]
	}

	/**
	 * returns a polygon made of the rectangles corners
	 *
	 * @returns {*[]}
	 */
	getPoly(){
		return [[
			[this.rect[0][0], this.rect[0][1]],
			[this.rect[1][0], this.rect[0][1]],
			[this.rect[1][0], this.rect[1][1]],
			[this.rect[0][0], this.rect[1][1]]
		]]
	}

}

/**
 * Class GeoJSONFeatureCollection
 */
class GeoJSONFeatureCollection{

	/**
	 * GeoJSONFeatureCollection constructor
	 */
	constructor(){
		this.json = {
			type:     'FeatureCollection',
			features: [],
		};
	}

	/**
	 * @returns {{type: string, features: Array}|*}
	 */
	getJSON(){
		this.json.features.forEach((feature, i) => this.json.features[i] = feature.getJSON());

		return this.json;
	}

	/**
	 * @param type
	 * @param properties
	 * @returns {GeoJSONFeatureCollection}
	 */
	setCRS(type, properties){
		this.json.crs = {
			type:       type,
			properties: properties,
		};

		return this;
	}

	/**
	 * @param properties
	 * @returns {GeoJSONFeature}
	 */
	addFeature(properties){
		var feature = new GeoJSONFeature(properties);
		this.json.features.push(feature);

		return feature;
	}
}

/**
 * Class GeoJSONFeature
 */
class GeoJSONFeature{

	/**
	 * GeoJSONFeature constructor
	 *
	 * @param properties
	 */
	constructor(properties){
		this.json = {
			type:       'Feature',
			geometry:   {
				type       : '',
				coordinates: [],
			},
			properties: properties || {},
		};
	}

	/**
	 * @returns {{type: string, geometry: {type: string, coordinates: Array}, properties: (*|{})}|*}
	 */
	getJSON(){
		return this.json;
	}

	/**
	 * @param id
	 * @returns {GeoJSONFeature}
	 */
	setID(id){

		if(id){
			// serving both, leaflet and Gmaps...
			this.json.id = id;
			this.json.properties.id = id;
		}

		return this;
	}

	/**
	 * @param coords
	 * @param type
	 * @returns {GeoJSONFeature}
	 */
	setGeometry(coords, type){
		this.json.geometry.coordinates = coords;
		this.json.geometry.type = GeoJSONFeature.in_array(type, [
			'Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon', 'GeometryCollection'
		]) ? type : 'Point';

		return this;
	}

	/**
	 * @link http://phpjs.org/functions/in_array/
	 *
	 * @param needle
	 * @param haystack
	 * @returns {boolean}
	 */
	static in_array(needle, haystack){

		for(var key in haystack){
			if(haystack.hasOwnProperty(key)){
				if(haystack[key] === needle){
					return true;
				}
			}
		}

		return false;
	}

}
