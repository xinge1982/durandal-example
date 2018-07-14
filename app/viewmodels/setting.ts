var ko = require('knockout');

class setting {
    title = ko.observable("hello");

    binding() {
        console.log('Lifecycle : binding : setting');
        return { cacheViews: false }; //cancels view caching for this module, allowing the triggering of the detached callback
    }
    bindingComplete() {
        console.log('Lifecycle : bindingComplete : setting');
    }
    attached(view, parent) {
        console.log('Lifecycle : attached : setting');
    }
    compositionComplete(view) {
        console.log('Lifecycle : compositionComplete : setting');
    }
    detached(view) {
        console.log('Lifecycle : detached : hello');
    }

    changeTitle() {

    }
}

export = setting;