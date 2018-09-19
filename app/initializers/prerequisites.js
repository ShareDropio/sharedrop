/* jshint -W030 */
import config from 'share-drop/config/environment';
import FileSystem from '../services/file';
import Analytics from '../services/analytics';
import { Promise } from 'rsvp';
import $ from 'jquery';

export function initialize(application) {
    application.deferReadiness();

    checkWebRTCSupport()
    .then(clearFileSystem)
    .catch(function (error) {
        application.error = error;
    })
    .then(authenticateToFirebase)
    .then(trackSizeOfReceivedFiles)
    .then(function () {
        application.advanceReadiness();
    });

    function checkWebRTCSupport() {
        return new Promise(function (resolve, reject) {
            // window.util is a part of PeerJS library
            if (window.util.supports.sctp) {
                resolve();
            } else {
                reject('browser-unsupported');
            }
        });
    }

    function clearFileSystem() {
        return new Promise(function (resolve, reject) {
            // TODO: change File into a service and require it here
            FileSystem.removeAll()
            .then(function () {
                resolve();
            })
            .catch(function () {
                reject('filesystem-unavailable');
            });
        });
    }

    function authenticateToFirebase() {
        return new Promise(function (resolve) {
            var xhr = $.getJSON('/auth');
            return xhr.then(function (data) {
                console.log(data);
                var ref = new window.Firebase(config.FIREBASE_URL);
                application.ref = ref;
                application.userId = data.id;
                application.publicIp = data.public_ip;
                resolve();
            });
        });
    }

    // TODO: move it to a separate initializer
    function trackSizeOfReceivedFiles() {
        $.subscribe('file_received.p2p', function (event, data) {
            Analytics.trackEvent('file', 'received', 'size', Math.round(data.info.size / 1000));
        });
    }
}

export default {
    name: 'prerequisites',
    initialize: initialize
};
