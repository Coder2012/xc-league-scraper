class Test {
    constructor(){
        console.log('constructor');
        this.init();
    }

    init() {
        console.log('init');
    }
}

module.exports = Test;