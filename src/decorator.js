/** Decorator Helper **/
/**
 * Allows you to do either:
 *   @property
 *   test = {}
 * OR
 *   @property()
 *   test = {}
 * OR
 *   @property({option1: true})
 *   test = {}
 *
 * It tacks on options to the descriptor object
 */
export function decorator(fn) {
    return function (options) {
        if (arguments.length <= 1) {
            return function (target, key, descriptor) {
                Object.assign(descriptor, options);

                return fn.call(target, target, key, descriptor);
            }
        } else if (arguments.length === 3) {
            return fn.apply(arguments[0], arguments);
        } else {
            throw 'Illegal invocation of decorator';
        }
    }
}