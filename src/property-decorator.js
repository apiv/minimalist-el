import decorator from './decorator';

/** Property Decorator **/
export const property = decorator(function (target, key, descriptor) {
    ensurePrototypeProperties(target);

    // apply defaults
    descriptor = Object.assign({
        nullable: false,
        attr: true,
        type: 'string'
    }, descriptor);

    // this ensures that ALL properties have an initializer, defaulting
    // to an initializer which returns undefined.
    // this is so all dev-defined properties will exist in the _properties hash
    // upon instantiation.
    target._initializers[key] = descriptor.initializer || function () {
            return undefined
        };

    descriptor.configurable = false;
    descriptor.enumerable = true;
    delete descriptor.value;
    delete descriptor.initializer;
    delete descriptor.writable;

    descriptor.get = descriptor.get || function () {
            let properties = ensureInstanceProperties(this);
            return properties[key];
        };

    descriptor.set = descriptor.set || function (value) {
            let properties = ensureInstanceProperties(this);
            let oldValue = properties[key];
            properties[key] = value;
            this.propertyChangedCallback(key, oldValue, value);
        };

    if (descriptor.nullable === true) {
        let getter = descriptor.get;
        descriptor.get = function () {
            return this::getter() || null;
        };
    }

    if (descriptor.type) {
        let setter = descriptor.set;
        descriptor.set = function (value) {
            value = coerce(value, descriptor.type);

            return this::setter(value);
        };

        let getter = descriptor.get;
        descriptor.get = function () {
            return coerce(this::getter(), descriptor.type);
        };
    }

    return descriptor;
});

/** Helper Methods **/
function ensurePrototypeProperties(target) {
    if (!target._properties) {
        // create a new WeakMap on the prototype to store
        // instance => propertiesObject
        Object.defineProperty(target, '_properties', {
            value: new WeakMap,
            enumerable: false,
            writable: false,
            configurable: false
        });
    }

    if (!target._initializers) {
        Object.defineProperty(target, '_initializers', {
            value: {},
            enumerable: false,
            writable: false,
            configurable: false
        });
    }
}

function ensureInstanceProperties(instance) {
    var properties = instance._properties.get(instance);

    // ensure that the properties hash exists
    if (!properties) {
        properties = {};

        // apply initial values
        for (var [prop, initializer] of Object.entries(this._initializers)) {
            properties[prop] = initializer();
        }

        instance._properties.set(instance, properties);
    }

    return properties;
}

function coerce(value, type) {
    switch (type) {
        case 'object':
            if (typeof value === 'string' && value !== '') {
                value = JSON.parse(value);
            }
            break;
        case 'integer':
            if (typeof value === 'string') {
                value = parseInt(value);
            }
            break;
        case 'float':
            if (typeof value === 'string') {
                value = parseFloat(value);
            }
            break;
    }

    return value;
}