$(document).ready(function() {   
    var jobCollection = [];
    var queues = [];
    
    var getJobs = function (callback) {
        jQuery.ajax({
            complete:function (request, textStatus) {
                //console.log('complete', request, textStatus);
            },
            dataType:'json',
            error:function (request, textStatus, errorThrown) {
                //console.log('error', request, textStatus, request.getAllResponseHeaders());
            },
            statusCode: {
                403: function () {
                    console.log('403');
                },
                500: function () {
                    console.log('500');
                }
            },
            success: function (data, textStatus, request) {                
                jobCollection = data;
                callback();
            },
            url:'https://api.travis-ci.org/jobs/'
        });         
    };
    
    var buildQueues = function (jobCollection, callback) {
        var jobCollectionLength = jobCollection.length;
        //var queues = [];
        
        for (var jobCollectionIndex = 0; jobCollectionIndex < jobCollectionLength; jobCollectionIndex++) {
            var job = jobCollection[jobCollectionIndex];
            var jobQueueName = job.queue.replace('builds.', '');
            
            if (queues[jobQueueName] === undefined) {
                queues[jobQueueName] = [];
            }
            
            queues[jobQueueName].push(job);
        }

        callback();
    }
    
    var presentQueues = function (queues) {
        var queueGroups = [];
        var queueIndex = 0;
        
        var currentQueueGroup = [];

        for (var queueName in queues) {
            if (queues.hasOwnProperty(queueName)) {                
                currentQueueGroup.push(queueName);
                
                if (queueIndex % 3 === 2) {
                    queueGroups.push(currentQueueGroup);
                    currentQueueGroup = [];
                }                
                
                queueIndex++;
            }
        }                
        
        queueGroups.push(currentQueueGroup);
        
        for (var queueGroupIndex = 0; queueGroupIndex < queueGroups.length; queueGroupIndex++) {
            var row = $('<div class="row-fluid" />');
            
            for (queueIndex = 0; queueIndex < queueGroups[queueGroupIndex].length; queueIndex++) {
                var queueName = queueGroups[queueGroupIndex][queueIndex];
                var queueLength = queues[queueName].length;
                var queueContent = $('<div class="span4" />');                
                queueContent.append($('<h2>'+queueName+' ('+(queueLength)+')</h2>'));
                
                var jobListMaxiumumLimit = 10;
                var jobListLimit = Math.min(queueLength, jobListMaxiumumLimit);
                
                var jobList = $('<ul class="job-list" />');
                
                for (var jobIndex = 0; jobIndex < jobListLimit; jobIndex++) {
                    console.log(queues[queueName][jobIndex]);
                    
                    var jobId = queues[queueName][jobIndex].id;
                    jobList.append($('<li id="job-'+(jobId)+'">job ('+(jobId)+')</li>'));
                    //presentJobInList(jobId);
                }
                
                queueContent.append(jobList);                
                row.append(queueContent);
            }
            
            
            $('#rows').append(row);
        }
    };
    
    var presentJobInList = function (id) {
        jQuery.ajax({
            complete:function (request, textStatus) {
                //console.log('complete', request, textStatus);
            },
            dataType:'json',
            error:function (request, textStatus, errorThrown) {
                //console.log('error', request, textStatus, request.getAllResponseHeaders());
            },
            statusCode: {
                403: function () {
                    console.log('403');
                },
                500: function () {
                    console.log('500');
                }
            },
            success: function (data, textStatus, request) {                
                console.log(data);
            },
            url:'https://api.travis-ci.org/jobs/' + id
        });        
    };
    
    getJobs(function () {
        buildQueues(jobCollection, function () {
            presentQueues(queues);
        });
    });   
});