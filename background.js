function get_tab_url(){
    return new Promise((resolve, reject)=>{
        chrome.tabs.getSelected(null, function(tab){
            resolve(tab.url)
        });
    });
}

function makeHttpObject() {
    try {return new XMLHttpRequest();}
    catch (error) {}
    try {return new ActiveXObject("Msxml2.XMLHTTP");}
    catch (error) {}
    try {return new ActiveXObject("Microsoft.XMLHTTP");}
    catch (error) {}

    throw new Error("Could not create HTTP request object.");
}

function set_token(token){
    chrome.storage.local.set({wefu_token: token}, function(){ });
}

function set_collected_flag(flag) {

    chrome.storage.local.set({wefu_collected_flag : flag}, function(){ });

} 

function set_request_flag(flag) {

    chrome.storage.local.set({wefu_request_flag : flag}, function(){ });
}

function save_data_in_storage(data){
    chrome.storage.local.set({wefu_product_data : data}, function(){
        console.log("Data stored in storage")
        set_collected_flag(true)
    });
}

// function save_cart_data(){
//     chrome.storage.local.set({wefu_cart_data : "empty"}, function(){
//     });
// }

function get_collected_flag(){ 
    return new Promise((resolve, reject)=>{
        chrome.storage.local.get('wefu_collected_flag', function(flag){
            if(flag != null){
                resolve(flag.wefu_collected_flag)
            }
        });
    });
}

function get_request_flag(){ 
    return new Promise((resolve, reject)=>{
        chrome.storage.local.get('wefu_request_flag', function(flag){
            if(flag != null){
                resolve(flag.wefu_request_flag)
            }
        });
    });
}

function empty_data_storage(){
    chrome.storage.local.set({wefu_product_data : ""}, function(){  });
}

async function main(){

    request_flag = await get_request_flag()
    if( request_flag == true ){
        set_request_flag(false)
        url = await get_tab_url();
        console.log("URL IS: "+url)
        var request = makeHttpObject();
        request.open("POST", "http://localhost:5000", true)
        request.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
        // request.responseType = 'json'
        request.send("product_url="+url);
        request.onreadystatechange = function() {
            if (request.readyState == 4){
                console.log(request.response)
                data = request.response
                // data = JSON.parse(data)
                save_data_in_storage(data)
                // set_request_flag(false)
            }
            if(request.readyState == 0){
                console.log("Request Error")
                chrome.runtime.sendMessage({error_msg : "ERROR"});
            }
        }
        request.onerror = function(){
            console.log("Request Error")
            chrome.runtime.sendMessage({error_msg : "ERROR"});
        }
    }

}


////////////////////////////////////////////////////////////////////////////////
//
//
//
/////////////////////////>>>>>>> SETTING DEFAULT VALUES
                set_request_flag(true)
                set_collected_flag(false)
                // save_cart_data()
                set_token(null);
//
//
//
////////////////////////////////////////////////////////////////////////////////////
// chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
//     if (request.method == "getLocalStorage")
//       sendResponse({data: localStorage[request.key]});
//     else
//       sendResponse({}); // snub them.
// });