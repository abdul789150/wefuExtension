console.log("hI im herre");

auth_checking();

$("#login_btn").click(function(){ 
    console.log('button clicked:')

    var form_data = $("#login_form").serializeArray();
    console.log(form_data)
    $.ajax({
        method: "POST",
        url: "http://localhost/FYP_WEFU/wefu6.0/public/api/login",
        data: form_data,
        cache: false,
        async: true,
        success: function(result){
            console.log(result);
            save_token(result["success"]["token"]);
            auth_checking();
        },
        error: function(result){
            console.log("Sorry bro try again")
            save_token(null);
            console.log(result);
        }
        
    });
});

$('#login_form').submit(function(){
    return false;
});

async function auth_checking(){
    token = await get_token();
    if(token != null){
        // console.log("Show add to cart button, or error button, simply call the response check tab function");
        console.log("working_on_data"); 
        $('#login_section').hide();       
        check_tab();
    }else{
        console.log("Please Login first");
        // show_error();
    }
}



function get_token(){
    return new Promise((resolve, reject)=>{
        chrome.storage.local.get('wefu_token', function(token){
            if(token != null){
                resolve(token.wefu_token)
            }
        });
    });
}

function save_token(token){
    chrome.storage.local.set({wefu_token: token}, function(){ });
}

// Add to cart
$('#cart_btn').click(async function(){
    data = await get_product_data();
    data = JSON.parse(data);
    console.log(data);

    var size = Object.keys(data["available_sellers"]).length;
    var selected_seller = undefined
    if( size > 0 ){
        var $rad = $('input[name=selection]');
        var value = $rad.filter(':checked').val();
        if(value != undefined){
            selected_seller = value.split('^');
        }
    }
    
    var obj_to_save = {}
    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            if(key == "name"){
                obj_to_save["product_name"] = data[key]
            }
            if(key == "img"){
                obj_to_save["product_img_link"] = data[key]
            }
            if(key != "available_sellers" && key != "img" && key != "name"){
                obj_to_save[key] = data[key]
            }
        }
    }    

    if(selected_seller != undefined){
        obj_to_save["price"] = selected_seller[0]
        obj_to_save["condition"] = selected_seller[1]
        obj_to_save["seller_info"] = selected_seller[2]
    }

    var token = await get_token();

    $.ajax({
        method: "POST",
        url: "http://localhost/FYP_WEFU/wefu6.0/public/api/addToCart",
        headers: {"Accept":"application/json", "Authorization" : "Bearer " + token},
        data: obj_to_save,
        cache: false,
        async: true,
        success: function(result){
        
            console.log(result);
            hide_all()
            set_default_values()
            check_tab()
        
        },
        error: function(result){
            console.log(result);
            hide_all()
            set_default_values()
            show_error()
        }
        
    });
});

// Delete From cart
$('').click();

// Show cart data
$('').click();


// show selected seller
$(document).ready(function(){
    var $radios = $('input[name=selection]').change(function () {
        var value = $radios.filter(':checked').val();
        console.log('ok changing');
        $('#selected_seller').html('Selected Seller: ')    
        $('#selected_value').html(value);    
    });

});

