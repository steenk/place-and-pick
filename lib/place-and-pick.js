define(['tripledollar', 'key-value-pointer'], function ($$$, kvp) {

	function deepCopy (obj, depth) {
        if (depth > 256) {
            console.log(new Error("Structure is too deep."));
            return undefined;
        }
        if (obj === null) return null;
        if (typeof obj !== 'object') return obj;
        var x,
            t = Object.prototype.toString.call(obj),
            cpy;
        if (t === '[object Date]') return new Date(obj);
        else if (t === '[object Array]') cpy = [];
        else if (t === '[object Object]') cpy = {};
        else return undefined;
        for (x in obj) {
            cpy[x] = deepCopy(obj[x], depth + 1);
        }
        return cpy;
    }

    function hasProperty (obj, prop) {
    	var p, has = false;
    	for (p in obj) {
    		if (p === prop) {
    			has = true;
    			break;
    		}
    	}
    	return has;
    }

	function pickData (elem, model) {
		var data = kvp(deepCopy(elem._data) || {}),
			value;
		Object.keys(model).forEach(function (id) {
			if (!model[id] || !model[id].pointer || !model[id].type) return;
			var key = /#|\./.test(id) ? id : '#' + id,
				input = elem.query(key),
				pointer;
			if (input) {
				if ('checkbox' === input.type) {
					data.replace(model[id].pointer, input.checked);
				} else if (model[id].type === Array) {
					for (var i = 0; i < input.children.length; i++) {
						pointer = model[id].pointer + '/' + i;
						if (data.select(pointer)) {
							data.replace(pointer, pickData(c.item(i), model[id].model));
						} else {
							data.insert(pointer, pickData(c.item(i), model[id].model));
						}
					}
				} else {
					value = hasProperty(input, 'value') ? input.value : input.textContent;
					if (data.select(model[id].pointer)) {
						data.replace(model[id].pointer, model[id].type(value).valueOf());
					} else {
						data.insert(model[id].pointer, model[id].type(value).valueOf());
					}
				}
				
			}
		})
		return data.getObject();
	}


	function placeData (elem, model, data) {
		if (!data || !elem) return;
		var template;
		elem._data = data;
		data = kvp(data);
		Object.keys(model).forEach(function (id) {
			var input = elem.query('#' + id),
				value = data.select(model[id].pointer) || '';
			if (input) {
				if (model[id].type === Array) {
					template = $$$.structify(input.firstChild);
					$$$.destroy(input);
					value.forEach(function (v, i) {
						var row = $$$(template);
						input.ins(row);
						placeData(row, model[id].model, v);
					})
				} else if (model[id].type === Boolean) {
					input.checked = Boolean(value);
				} else {
					if (hasProperty(input, 'value')) {
						input.value = model[id].type(value);
					} else {
						input.textContent = model[id].type(value);
					}
				}
			}
		})
	}

	return {
		pickData: pickData,
		placeData: placeData
	}

})
