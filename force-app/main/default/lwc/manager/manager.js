import { LightningElement, track, api } from 'lwc';
import getCurrentlyScheduleCron from "@salesforce/apex/SchedulingService.getCurrentlyScheduleCron";
import runFirstJob from "@salesforce/apex/SchedulingService.runFirstJob";
import checkFirstJobStatus from "@salesforce/apex/SchedulingService.checkFirstJobStatus";
import scheduleJob from "@salesforce/apex/SchedulingService.scheduleJob";
import deleteScheduledJob from "@salesforce/apex/SchedulingService.deleteScheduledJob";

export default class Manager extends LightningElement {
    cronJobName = "Job";
    methodName = "createMailing";
    @track currentCronAsTime;
    currentCronAsString;
    state;
    loading;

    connectedCallback() {
        this.loading = true;
        this.getScheduledCron();
    }

    getScheduledCron() {
        getCurrentlyScheduleCron({ cronJobName: this.cronJobName })
            .then(result => {
                switch (result) {
                    case "test":
                        this.state = result;
                        break;
                    case "schedule":
                        this.state = result;
                        break;
                    default:
                        this.currentCronAsTime = this.convertCronToTime(result);
                        console.log("Job Scheduled for: " + this.currentCronAsTime);
                        this.state = "reschedule";
                }
                this.stopLoading(500);
            })
            .catch(error => {
                this.stopLoading(500);
            });
    }

    convertCronToTime(result) {
        let cronArray = result.split(" ");
        let [second, minute, hour] = cronArray;
        return `${hour}:${minute}:00.000`;
    }

    runFirstJob() {
        this.loading = true;
        runFirstJob({})
            .then(data => {
                this.checkFirstSecurityJobStatus();
            })
            .catch(error => {
                this.stopLoading(500);
            });
    }

    checkFirstJobStatus() {
        checkFirstJobStatus({
            submittedDatetime: this.dateTimeSubmitted,
            methodName: this.methodName
        })
            .then(result => {
                switch (result) {
                    case "Completed":
                        this.state = "schedule";
                        this.stopLoading;
                        break;
                    case ("Aborted", "Failed"):
                        this.stopLoading(500);
                        console.log(data.ExtendedStatus);
                    default:
                        setTimeout(() => {
                            console.log("Checking");
                            this.checkFirstJobStatus();
                        }, 100);
                }
            })
            .catch(error => {
                console.log(error.message);
            });
    }

    scheduleApexJob() {
        this.loading = true;
        scheduleJob({
            cronString: this.currentCronAsString,
            cronJobName: this.cronJobName
        })
            .then(data => {
                console.log(data);

                if (data) {
                    this.state = "reschedule";
                    this.getScheduledCron();
                } else {
                    this.stopLoading(500);
                    console.log("Unable to Schedule Job");
                }
            })
            .catch(error => {
                this.stopLoading(500);
                console.log(error.message);
            });
    }

    deleteJob() {
        this.loading = true;
        deleteScheduledJob({ cronJobName: this.cronJobName })
            .then(data => {
                console.log(data);
                if (data) {
                    this.state = "schedule";
                    this.currentCronAsTime = "";
                    this.stopLoading(500);
                    console.log("Job Deleted");
                } else {
                    this.stopLoading(100);
                    console.log("we were unable to delete this job");
                }
            })
            .catch(error => {
                this.stopLoading(100);
                console.log(error.message);
            });
    }

    handleTimeChange(event) {
        //let time = event.target.value;
        //let [hour, minute, seconds] = time.split(":");
        //this.currentCronAsString = `0 ${minute} ${hour} ? * * *`;
        this.currentCronAsString = event.target.value;
    }

    /**
 * @param {timeoutValue} timeoutValue
 */

    stopLoading(timeoutValue) {
        setTimeout(() => {
            this.loading = false;
        }, timeoutValue);
    }
}