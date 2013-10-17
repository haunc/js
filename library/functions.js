function toJSON(object)
{
	window._toJSON_disable_protect = true;
	var ret	=	object.toJSON();
	window._toJSON_disable_protect = false;
	return ret;
}

/**
 * Allow javascript's Error class to be extended
 */
var extend_error	=	function(extend, errname)
{
	var err						=	function() {
		var tmp	=	extend.apply(this, arguments);
		tmp.name = this.name = errname;

		this.stack		=	tmp.stack
		this.message	=	tmp.message

		return this;
	};
	err.prototype	=	Object.create(extend.prototype, { constructor: { value: err } });
	return err;
}

/**
 * HACK: Mootools internals!
 * Allows using this.parent() async
 *
 * before:
 *   this.parent.apply(this, arguments);
 *
 * after:
 *   get_parent(this).apply(this, arguments);
 */
function get_parent(obj)
{
	var name	=	obj.$caller.$name,
	parent		=	obj.$caller.$owner.parent,
	previous	=	(parent) ? parent.prototype[name] : null;
	if (!previous) throw new Error('The method "' + name + '" has no parent.');
	return previous;
}

/**
 * takes raw (non-mootools) object from whatever addon is running and ensures
 * that it is recursively turned into a mootools object
 */
function data_from_addon(data)
{
	return JSON.decode(JSON.encode(data));
}

// get the next tag of type "type" in the chain up the dom
function next_tag_up(tag, element)
{
	return element.get('tag') == tag ? element : next_tag_up(tag, element.getParent());
}

// for diffing two arrays against each other
function arrdiff(arr1, arr2) { return arr1.filter(function(el) { return !arr2.contains(el); }); };

// used in templating. wraps around EVERY image url, and rewrites it to use whatever
// storage facility we require (probably S3/cloudfront)
function img(url)
{
	if(window._base_url)
	{
		return window._base_url.replace(/\/$/, '') + url;
	}
	else
	{
		return url;
	}
}

function get_url()
{
	if(History.enabled)
		var url		=	new String(window.location.pathname).replace(/^\/?/, '');
	else
		var url		=	new String(window.location.hash).replace(/^#!\/?/, '');
	return url;
}

function get_data_from_querystring(url)
{
	url || (url = new String(window.location.hash).replace(/.*?&/, ''));
	var data = {};
	url.split('&').each(function(d) {
		var pieces	=	d.split('=');
		data[pieces[0]]	=	unescape(pieces[1]);
	});
	return data;
}

Array.prototype.unique = function() {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j, 1);
        }
    }

    return a;
};

String.implement({
	capitalize: function()
	{
		return (this.charAt(0).toUpperCase() + this.slice(1));
	},

	pad: function(num, pad)
	{
		var str	=	'';
		for(var i = 0; i < num - this.toString().length; i++)
		{
			str	+=	pad;
		}
		return str + this.toString();
	}
});

function clicked_outside(e, obj)
{
	if(!obj || !e || !obj.getCoordinates) return false;
	var c	=	obj.getCoordinates();
	if(e.page.x == 0 || e.page.y == 0 || c.bottom == 0) return false;
	var x	=	e.page.x;
	var y	=	e.page.y;
	if(x < c.left || x > c.right || y < c.top || y > c.bottom)
	{
		// click was outside given object
		return true;
	}
	return false;
}

Element.implement({ 
	monitorOutsideClick: function(fn) {
		document.addEvent('click', function(e) {
			if(clicked_outside(e, this))
			{
				fn();
			}
		}.bind(this));
	}
});

var empty	=	function(obj)
{
	if(obj == null)
	{
		return true;
	}

	switch(typeof(obj))
	{
	case 'undefined':
		return true;
	case 'number':
		return obj == 0;
	case 'string':
		return obj == '';
	case 'object':
		if(typeof(obj.length) == 'function')
		{
			return obj.length() == 0;
		}
		else
		{
			var items	=	0;
			Object.each(obj, function(val, key) {
				items++;
			});
			return items == 0;
		}
	}
};

var parse_querystring = function(qs)
{
	if(!qs) qs = window.location.search.replace(/^\?/, '');
	qs = qs.split('&');
	var data = {};
	qs.each(function(kv) {
		kv = kv.split('=');
		var key = kv[0];
		var val = kv[1];
		val = unescape(val);
		data[key] = val;
	});
	return data;
};

var view	=	{
	escape: function(str)
	{
		return str;
	},

	tagetize: function(tag_name, options)
	{
		options || (options = {});

		tag_name	=	tag_name.toLowerCase();
		if(options.escape)
		{
			tag_name	=	tag_name
				.replace(/&(?!amp;)/g, '&amp;')
				.replace(/"/g, '&quot;');
		}
		else
		{
			tag_name	=	tag_name
				.replace(/&amp;/g, '&')
				.replace(/&quot;/g, '"')
		}
		tag_name	=	tag_name.clean();
		return tag_name;
	},

	boardize: function(board_name)
	{
		return board_name;
	},

	// TODO: figure out why this sucks and breaks links.
	// TODO: figure out if actually needed anyway?
	make_links: function(text)
	{
		return text;
		text = text.replace(/"([\w]+):(\/\/([\.\-\w_\/:\?\+\&~#=%,\(\)]+))/gi, '"$1::$2"');
		text = text.replace(/([\w]+:\/\/)([\.\-\w_\/:\?\+\&~#=%,\(\)]+)/gi, '<a target="_blank" href="$1$2">$2</a>');
		text = text.replace(/"([\w]+)::(\/\/([\.\-\w_\/:\?\+\&~#=%,\(\)]+))/gi, '"$1:$2"');
		return text;
	}
};
