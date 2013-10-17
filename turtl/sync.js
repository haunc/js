// extend_error is in functions.js
var SyncError	=	extend_error(Error, 'SyncError');

/**
 * Default sync function, persists items to the local DB
 */
Composer.sync	=	function(method, model, options)
{
	options || (options = {});
	if(options.skip_sync && method == 'delete')
	{
		options.success();
		return;
	}
	else if(options.skip_sync) return;

	var table	=	options.table || model.get_url().replace(/^\/(.*?)(\/|$).*/, '$1');
	if(!turtl.db[table])
	{
		throw new SyncError('Bad db.js table: '+ table);
		return false;
	}

	var success	=	function(res)
	{
		if(res instanceof Array && res.length == 1)
		{
			res	=	res[0];
		}
		if(options.success) options.success(res);
	};
	var error	=	options.error || function() {};

	var modeldata			=	model.toJSON();
	modeldata.last_change	=	new Date().getTime();
	if(!options.skip_local_sync) modeldata.local_change = true;

	// any k/v data that doesn't go by the "id" field should have it's key field
	// filled in here.
	if(table == 'users')
	{
		modeldata.key	=	'user';
	}

	switch(method)
	{
	case 'read':
		turtl.db[table].get(model.id()).then(success, error);
		break;
	case 'create':
		// set the CID into the ID field. the API will ignore this field, except
		// to add it to the "sync" table, which will allow us to match the local
		// record with the remote record in the rare case that the object is
		// added to the API but the response (with the ID) doesn't update in the
		// local db (becuase of the client being closed, for instance, or the
		// server handling the request crashing after the record is added)
		modeldata.id	=	model.cid();
		turtl.db[table].add(modeldata).then(success, error);
		break;
	case 'update':
		turtl.db[table].update(modeldata).then(success, error);
		break;
	case 'delete':
		turtl.db[table].remove(model.id()).then(success, error);
		break;
	default:
		throw new SyncError('Bad method passed to Composer.sync: '+ method);
		return false;
	}
};

/**
 * This is the sync function used by the sync process to save data to the API.
 */
var api_sync	=	function(method, model, options)
{
	options || (options = {});
	if(options.skip_sync && method == 'delete')
	{
		options.success();
		return;
	}
	else if(options.skip_sync) return;
	switch(method)
	{
	case 'create':
		var method	=	'post'; break;
	case 'read':
		var method	=	'get'; break;
	case 'update':
		var method	=	'put'; break;
	case 'delete':
		var method	=	'_delete'; break;
	default:
		console.log('Bad method passed to Composer.sync: '+ method);
		return false;
	}

	// don't want to send all data over a GET or DELETE
	var args	=	options.args;
	args || (args = {});
	if(method != 'get' && method != '_delete')
	{
		var data	=	model.toJSON();
		if(data.keys && data.keys.length == 0)
		{
			// empty string gets converted to empty array by the API for the keys
			// type (this is the only way to serialize an empty array via 
			// mootools' Request AJAX class)
			data.keys	=	'';
		}
		if(options.subset)
		{
			var newdata	=	{};
			for(x in data)
			{
				if(!options.subset.contains(x)) continue;
				newdata[x]	=	data[x];
			}
			data	=	newdata;
		}
		args.data = data;
	}
	turtl.api[method](model.get_url(), args, {
		success: options.success,
		error: options.error
	});
};

