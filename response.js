var gobal_job_dispatcher = undefined
var error_section = document.getElementById("error_section")
var data_section = document.getElementById("data_section")
var spinner = document.getElementById('spinner')
var scrap_section = document.getElementById("scrap_section")

// set_badge()
hide_all()
// check_tab()
function hide_btn(){
    document.getElementById("#cart_btn").style.visibility = "hidden";
    document.getElementById("#checkout_btn").style.visibility = "hidden";
}

function show_btn(){
    document.getElementById("#cart_btn").style.visibility = "visible";
    document.getElementById("#checkout_btn").style.visibility = "visible";
}

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

function get_product_data(){ 
    return new Promise((resolve, reject)=>{
        chrome.storage.local.get('wefu_product_data', function(data){
            if(data != null){
                resolve(data.wefu_product_data)
            }else{
                resolve(-1)
            }
        });
    });
}

// function get_cart_data(){
//     return new Promise((resolve, reject)=>{
//         chrome.storage.local.get('wefu_cart_data', function(data){
//             if(data != null){
//                 resolve(data.wefu_cart_data)
//             }else{
//                 resolve(-1)
//             }
//         });
//     });
// }

function get_tab_url(){
    return new Promise( (resolve, reject)=>{
        chrome.tabs.getSelected(null, function(tab){
            resolve(tab.url)
        });
    });
}

function set_default_values(){
    chrome.runtime.getBackgroundPage(function(backgroundPage){
        backgroundPage.set_collected_flag(false)
        backgroundPage.set_request_flag(true)
        backgroundPage.empty_data_storage()
    });
    document.getElementById('info_table_body').innerHTML = "";
    document.getElementById('seller_table_body').innerHTML = "";
}

function show_error(){
    data_section.style.display = 'none'
    spinner.style.display = 'none'
    error_section.style.display = 'block'
    scrap_section.style.display = 'none'
    document.getElementById("wait_heading").innerHTML = "";
    set_default_values()
}

function show_loading(){
    data_section.style.display = 'none'
    spinner.style.display = 'block'
    error_section.style.display = 'none'
    scrap_section.style.display = 'none'
    document.getElementById("wait_heading").innerHTML = "Please Wait...";

}

function hide_all(){
    data_section.style.display = 'none'
    spinner.style.display = 'none'
    error_section.style.display = 'none'
    scrap_section.style.display = 'none'
}

async function check_tab(){
    tab_url = await get_tab_url()
    if( (tab_url.search('www.amazon.com') == -1) ){
        show_error()
    }else{
        collected_flag = await get_collected_flag()
        if(collected_flag == true){
            main()
        }else{
            request_flag = await get_request_flag()
            if(request_flag == false){
                start_job()
                show_loading()
            }else{
                show_scrap_button()
            }
        }
    }
}

function show_scrap_button(){
    scrap_section.style.display = 'block'
}

function start_job(){
    gobal_job_dispatcher = setInterval(  function(){ 
        console.log("Checking Collected Flag...")
        main() 
    } , 7000);
}
function stop_job(){
    clearInterval(gobal_job_dispatcher);
}

chrome.runtime.onMessage.addListener(function(message){
    if(message.error_msg == "ERROR"){
        show_error();
        set_default_values();
        stop_job()
    }
});


async function main(){
    
    collected_flag = await get_collected_flag()
    if(collected_flag == false){
        show_loading()
    }else if(collected_flag == true){
        console.log("Setting up data");
        stop_job()
        // set_request_flag(true)
        var data_obj = await get_product_data()
        show_data(data_obj)
    }

}

var details_btn = document.getElementById("get_details");
details_btn.addEventListener('click', async function(){
    var request_flag = await get_request_flag()
    if(request_flag == true){
        if((tab_url.search('www.amazon.com') != -1)){
            chrome.runtime.getBackgroundPage(function(backgroundPage){
                backgroundPage.main()
            });
            console.log("Requested for data");
            start_job()
            show_loading()
        }else{
            show_error()
            set_default_values()
        }
    }
});

var discard_btn = document.getElementById("discard_btn");
var cart_btn = document.getElementById("cart_btn");
var checkout_btn = document.getElementById("checkout_btn");

discard_btn.addEventListener('click', function(){
    hide_all()
    set_default_values();
    check_tab();
});

// cart_btn.addEventListener('click', async function(){
//     var data = await get_product_data()
//     try{
//         data = JSON.parse(data)
//     }catch(err){
//         console.log(err)
//     }
//     var size = Object.keys(data["available_sellers"]).length;
//     var selected_seller = undefined
//     if( size > 0 ){
//         var rad = document.getElementsByName("selection")
//         console.log(rad.length)
//         for(var i = 0, max = rad.length; i < max; i++) {
//             if(rad[i].checked){
//                 // console.log(rad[i].value)
//                 selected_seller = rad[i].value
//             }
//         }
//     }

//     add_product_to_cart(data, selected_seller)

// });

// checkout_btn.addEventListener('click', async function(){

// });

function show_data(data){

    data_section.style.display = 'block'
    spinner.style.display = 'none'
    error_section.style.display = 'none'
    scrap_section.style.display = 'none'
    document.getElementById("wait_heading").innerHTML = "";

    var table = document.getElementById('info_table_body')
    try{
        data = JSON.parse(data)
    }catch(err){
        console.log(err)
    }

    console.log(Object.keys(data).length)

    if(data["stock"] == -1){

        document.getElementById("stock_error").innerHTML = "Sorry this product is out of stock";
        document.getElementById("product_name").innerHTML = data["name"];
        document.getElementById("seller_table").style.display = 'none'
        hide_btn();


    }else{
        // show_btn();
        for (const key in data) {
            if (data.hasOwnProperty(key)) {            
                if(key == "name"){
                    document.getElementById("product_name").innerHTML = data["name"];
                }else if(key == "available_sellers"){
                    set_sellers_data(data[key])
                }else if(key == "img"){
                    document.getElementById("product_img").setAttribute('src', data[key])
                    document.getElementById("product_img").setAttribute('alt', data["name"])
                }
                else{
                    var tr = document.createElement("tr")
                    var td1 = document.createElement("td")
                    var td2 = document.createElement("td")
    
                    // td1.appendChild(document.createTextNode(key.bold() + ":   "))
                    td1.innerHTML = key.bold() + ":    ";
                    td2.appendChild(document.createTextNode(data[key]))
    
                    tr.appendChild(td1)
                    tr.appendChild(td2)
            
                    table.appendChild(tr)
    
                }
                
            }
        }
    }

}


function set_sellers_data(data){

    var size = Object.keys(data).length;
    var table = document.getElementById('seller_table_body')
    if(size > 0){
        for (const key in data) {
            if (data.hasOwnProperty(key)) {

                const element = data[key];
                var tr = document.createElement("tr")
                var td1 = document.createElement("td")
                var td2 = document.createElement("td")
                var td3 = document.createElement("td")
                var td4 = document.createElement("td")
                var radio_btn = document.createElement("input")
                radio_btn.setAttribute("type", "radio")
                radio_btn.setAttribute("name", "selection")
                radio_btn.setAttribute("value", element["price"]+ "^" + element["condition"]+ "^" + element["seller"])

                td1.appendChild(document.createTextNode(element["price"]))
                // td2.appendChild(document.createTextNode(element["condition"].bold()))
                // td3.appendChild(document.createTextNode(element["seller"].bold()))
                td2.innerHTML = element["condition"].bold()
                td3.innerHTML = element["seller"].bold()
                td3.setAttribute("class", "d-inline-block text-truncate")
                td3.setAttribute("style", "max-width: 130px;")
                td4.appendChild(radio_btn)

                tr.appendChild(td1)
                tr.appendChild(td2)
                tr.appendChild(td3)
                tr.appendChild(td4)
                
                table.appendChild(tr)
            }
        }

    }else{
        document.getElementById("seller_table").style.display = 'none'
        // document.getElementById("seller_error").innerHTML = "Sorry there are currently no available sellers"
    }
}


// async function add_product_to_cart(data, selected_seller){

//     if(selected_seller != undefined){
//         data["selected_seller"] = selected_seller
//     }
//     delete data["available_sellers"]
//     cart_obj = {}
//     cart = await get_cart_data()
//     if( cart == "empty"){
//         cart_obj["product_"+0] = {}
//         cart_obj["product_"+0] = data
    
//     }else{
//         var size = Object.keys(cart).length;
//         cart["product_"+size] = {}
//         cart["product_"+size] = data
//         cart_obj = cart
//     }

//     chrome.storage.local.set({wefu_cart_data : cart_obj}, function(){
//         console.log("Cart Data stored in storage")
//         hide_all()
//         set_default_values()
//         check_tab()
//         set_badge()
//     });

//     console.log(await get_cart_data())

// }

// spinner.style.display = 'none'

// async function set_badge(){
//     cart_data = await get_cart_data()
//     if(cart_data == "empty"){
//         document.getElementById("badge").innerHTML = "0"
//     }else{
//         size = Object.keys(cart_data).length;
//         document.getElementById("badge").innerHTML = size
//     }
// }