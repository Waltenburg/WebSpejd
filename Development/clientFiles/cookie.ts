/// <reference path="sendHTTPRequest.ts"/>
namespace Client{
    //Funktioner der bruges undervejs
    export function getCookie(name: string) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++) {
            var c = ca[i];
            while(c.charAt(0)==' '){c = c.substring(1,c.length)};
            if(c.indexOf(nameEQ) == 0){return c.substring(nameEQ.length,c.length)};
        }
        return null;
    }
    export function setCookie(cname: string, cvalue: string, exdays: number) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires="+d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }
    export function deleteCookie(cname: string) {
        var d = new Date();
        d.setTime(d.getTime() - 100000);
        var expires = "expires="+d.toUTCString();
        document.cookie = cname + "=;" + expires + ";path=/";
    }
}