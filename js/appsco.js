(function() {
    var clientId = 'au15j5ormy0okskoc4wkkk4ocs4k08cg8o4gkwck0sc0gwsos';
    var clientSecret = '3yia092s7c00skso4owgcsk48c4sggswwsws4wsoo8wo8wooc01mllst0zhts0044kk0w8w0scsgggcwcgcogsw0woswgog0osks';
    var accessToken = null;
    var loginCallback = null;
    var loginWindow = null;

    var gui = require('nw.gui');

    function getAppscoHeaders() {
        return {
            "Authorization": "token "+accessToken
        };
    }

    chrome.webRequest.onCompleted.addListener(function(details) {
        if (!loginCallback) return;

        var uri = URI(details.url);
        var qs = uri.query(true);
        var code = qs.code;
        if (!code) return;

        loginWindow.close();
        setTimeout(function() {
            loginWindow = null;
        }, 10);

        $.ajax({
            url: 'https://appsco.com/api/v1/token/get',
            method: 'post',
            data: {
                client_id: clientId,
                client_secret: clientSecret,
                code: code,
                redirect_uri: 'http://localhost'
            },
            success: function(data) {
                accessToken = data.access_token;
                $.ajax({
                    url: 'https://appsco.com/api/v1/profile/me',
                    headers: getAppscoHeaders(),
                    success: function(data) {
                        var cb = loginCallback;
                        loginCallback = null;
                        cb(data);
                    }
                });
            }
        });
    }, {urls: ["*://localhost/*"]});

    App.Appsco = {
        getAccessToken: function () {
            return accessToken;
        },
        login: function (callback) {
            loginCallback = callback;
            var url = sprintf('https://appsco.com/oauth/authorize?client_id=%s&redirect_uri=http://localhost&scope=%s',
                clientId,
                'profile_read dashboard_list dashboard_icon_list all'
            );

            loginWindow = gui.Window.open (url, {
                left: 250,
                height: 580,
                width: 450,
                show_in_taskbar: false,
                show: false
            });

            window.appscoLoginWindow = loginWindow;

            setTimeout(function() {
                if (loginWindow) {
                    loginWindow.show();
                    loginWindow.focus();
                }
            }, 500);
        },
        listDashboards: function(callback) {
            $.ajax({
                url: 'https://appsco.com/api/v1/dashboard',
                headers: getAppscoHeaders(),
                success: function(data) {
                    callback(data);
                }
            })
        },
        loadIcons: function(profile, callback) {
            for (var i=0; i<profile.dashboards.length; i++) {
                (function(dashboardRoleId, index) {
                    var url = sprintf('https://appsco.com/api/v1/dashboard/%s/icon', dashboardRoleId);
                    $.ajax({
                        url: url,
                        headers: getAppscoHeaders(),
                        success: function(data) {
                            callback(index, data);
                        }
                    });
                })(profile.dashboards[i].role_id, i);
            }
        }
    };
})();