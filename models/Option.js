
var keystone = require('keystone');
var _ = require('lodash');
var hash = require('object-hash')
var Types = keystone.Field.Types;

var Option = new keystone.List('Option', {
  map: { name: 'key' },
});

var config = keystone.get('options') || {};

var fields = {};
var fieldMap = {};
var allOptions = [];
var allFields = {};

// run through each field type
_.each(config, function(optionList, type){

  // run through each option of the field type
  _.each(optionList, function(option){
    var optionKey = option;
    var fieldOptions = {};

    // if option is an object, set the key and set the field options
    if(_.isObject(option)){
      optionKey = option.key;
      fieldOptions = option;
      delete fieldOptions.key;
    }

    // hash the field options and use as value field key
    var fieldHash = 'value' + type + '_' + hash(fieldOptions);

    // push option key to all options array
    allOptions.push({ value: optionKey, label: optionKey });

    // add option key to field map, mapping field to value field
    fieldMap[optionKey] = fieldHash;

    // if field doesn't already exist in all fields array, create it, adding custom options
    if(!allFields[fieldHash])
      allFields[fieldHash] = _.extend({ type: Types[type], label: 'Value', dependsOn: {key: []} }, fieldOptions);

    // push the field to the value field dependencies
    allFields[fieldHash].dependsOn.key.push(optionKey);

  });

});

fields.key = { type: Types.Select, label: 'Option', options: _.sortBy(allOptions, function(o) { return o.label; }), required: true, initial: true, index: true },
fields = _.merge(fields, allFields);

Option.add(fields);

// Only allow one option per key
Option.schema.pre('validate', function(next) {
  var validating = this;

  Option.model.findOne().where('key', this.key).exec(function(err, option){
    if(option && !option._id.equals(validating._id)){
      next(Error('Option already exists'));
    }else{
      next();
    }
  });
});

// set value for option
Option.schema.methods.setValue = function (val) {
  this[Option.valueField(this.key)] = val;
};

// fetch correct value for option
Option.schema.methods.value = function () {
  return this[Option.valueField(this.key)];
};

// fetch correct underscore methods
Option.schema.methods.value_ = function () {
  return this._[Option.valueField(this.key)];
};

Option.track = true;
Option.defaultColumns = 'key';
Option.register();

Option.valueField = function(option){
  return fieldMap[option] || null;
}

Option.fetch = function(option, callback){
  if(Option.valueField(option)){
    if(callback) {
      return Option.model.findOne()
        .where('key', option)
        .exec(function(err, o) {
          if(err) return callback(err);
          callback(null, o ? o : null);
        });
    } else {
      var options = keystone.get('options-cached');
      var found = _.find(options, {key: option});

      if(found)
        return found;
    }
  }

  return callback ? callback(null, null) : null;
};
