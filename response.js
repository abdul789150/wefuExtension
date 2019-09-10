var gobal_job_dispatcher = undefined
var error_section = document.getElementById("error_section")
var data_section = document.getElementById("data_section")
var spinner = document.getElementById('spinner')
var scrap_section = document.getElementById("scrap_section")

hide_all()
check_tab()

function get_collected_flag(){ 
    return new Promise((resolve, reject)=>{
        chrome.storage.local.get('collected_flag', function(flag){
            if(flag != null){
                resolve(flag.collected_flag)
            }
        });
    });
}

function get_request_flag(){ 
    return new Promise((resolve, reject)=>{
        chrome.storage.local.get('request_flag', function(flag){
            if(flag != null){
                resolve(flag.request_flag)
            }
        });
    });
}

function get_product_data(){ 
    return new Promise((resolve, reject)=>{
        chrome.storage.local.get('product_data', function(data){
            if(data != null){
                resolve(data.product_data)
            }else{
                resolve(-1)
            }
        });
    });
}

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
}

function show_error(){
    data_section.style.display = 'none'
    spinner.style.display = 'none'
    error_section.style.display = 'block'
    scrap_section.style.display = 'none'
    document.getElementById("wait_heading").innerHTML = "";
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
            show_scrap_button()
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
    } , 10000);
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

    var tab_url = await get_tab_url();
    var request_flag = await get_request_flag()
    console.log("In Main");
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
    }else{
        collected_flag = await get_collected_flag()
        if(collected_flag == false){
            show_loading()
        }else if(collected_flag == true){
            console.log("Setting up data");
            stop_job()
            var data_obj = await get_product_data()
            show_data(data_obj)
        }
    }
}


var details_btn = document.getElementById("get_details");
details_btn.addEventListener('click', function(){
    main();
});

// Will be called by button
// main()

function show_data(data){

    data_section.style.display = 'block'
    spinner.style.display = 'none'
    error_section.style.display = 'none'
    scrap_section.style.display = 'none'
    document.getElementById("wait_heading").innerHTML = "";

    var table = document.getElementById('info_table')
    data = JSON.parse(data)
    console.log(Object.keys(data).length)

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


function set_sellers_data(data){

    var size = Object.keys(data).length;
    var table = document.getElementById('seller_table')
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

                td1.appendChild(document.createTextNode(element["price"]))
                // td2.appendChild(document.createTextNode(element["condition"].bold()))
                // td3.appendChild(document.createTextNode(element["seller"].bold()))
                td2.innerHTML = element["condition"].bold()
                td3.innerHTML = element["seller"].bold()
                td4.appendChild(radio_btn)

                tr.appendChild(td1)
                tr.appendChild(td2)
                tr.appendChild(td3)
                tr.appendChild(td4)
                
                table.appendChild(tr)
            }
        }

    }else{
        table.style.display = 'none'
        document.getElementById("seller_error").innerHTML = "Sorry there are currently no available sellers"
    }
}

// spinner.style.display = 'none'