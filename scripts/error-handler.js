/**
 * Set app routes
 */

module.exports = function(app) {    
    app.use((error, request, response, next) => {
        console.log('Error: ', error);        
        response.status(500).json({ error });
    })
}
