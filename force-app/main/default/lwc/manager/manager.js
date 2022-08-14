import { LightningElement, track, api } from 'lwc';
import getCurrentlyScheduleCron from "@salesforce/apex/SchedulingService.getCurrentlyScheduleCron";
import runFirstJob from "@salesforce/apex/SchedulingService.runFirstJob";
import checkFirstJobStatus from "@salesforce/apex/SchedulingService.checkFirstJobStatus";
import scheduleJob from "@salesforce/apex/SchedulingService.scheduleJob";
import deleteScheduledJob from "@salesforce/apex/SchedulingService.deleteScheduledJob";
import checkClass from '@salesforce/apex/SchedulingService.checkClass';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';


export default class Manager extends LightningElement {
    cronJobName = "Job";
    @api batchClass = "";
    @api scheduleClass = "";
    @api methodName = "createMailing";
    @track currentCronAsTime;
    currentCronAsString;
    state;
    loading;
    btn1 = "";
    btn2 = "display:none";
    isInputDisabled = false;
    //btnLabel = 'Schedule Job';
    //btnClass = 'brand';
    //btnFunc = this.scheduleApexJob;

    connectedCallback() {
        this.loading = true;
        this.getScheduledCron();
        this.currentCronAsString = sessionStorage.getItem('cron');
        if (sessionStorage.getItem('cron') != null) {
            this.isInputDisabled = sessionStorage.getItem('isDisabled');
            this.btn2 = sessionStorage.getItem('btn2');
            this.btn1 = sessionStorage.getItem('btn1');
        }
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
        runFirstJob({ myBatchClass: this.batchClass })
            .then(data => {
                const evt = new ShowToastEvent({
                    title: 'Notification',
                    message: 'Batch Class is running',
                    variant: 'success',
                });
                this.dispatchEvent(evt);
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
        console.log('schedule', this.scheduleClass);
        this.loading = true;
        //class
        checkClass({ className: this.scheduleClass })
            .then(data => {
                console.log('class', data);
                scheduleJob({
                    cronString: this.currentCronAsString,
                    cronJobName: this.cronJobName,
                    apexClass: data,
                    myBatch: this.batchClass
                })
                    .then(data => {

                        // console.log("field", this.template.querySelector('lightning-input'));
                        // this.template.querySelector('lightning-input').addEventListener(function () {
                        //    sessionStorage.setItem('cron', this.currentCronAsString);
                        // });
                        if (data) {

                            this.state = "reschedule";
                            this.getScheduledCron();
                            //this.btnClass = 'destructive';
                            //this.btnLabel = 'Abort Batch';
                            //this.btnFunc = this.deleteJob;
                            console.log(data);
                            const evt = new ShowToastEvent({
                                title: 'Notification',
                                message: 'Scheduled Job is added',
                                variant: 'success',
                            });
                            this.dispatchEvent(evt);
                            this.btn2 = "";
                            this.btn1 = "display:none";
                            this.isInputDisabled = true;
                            sessionStorage.setItem('cron', this.currentCronAsString);
                            sessionStorage.setItem('btn1', this.btn1);
                            sessionStorage.setItem('btn2', this.btn2);
                            sessionStorage.setItem('isDisabled', this.isInputDisabled);

                        } else {
                            this.stopLoading(500);
                            const evt = new ShowToastEvent({
                                title: 'Notification',
                                message: 'Scheduled job has already been added or CRON String is empty',
                                variant: 'error',
                            });
                            this.dispatchEvent(evt);
                            console.log("Unable to Schedule Job1");
                        }
                    })
                    .catch(error => {
                        this.stopLoading(500);
                        console.log(error.message);
                    });
            })
            .catch(error => {
                console.log(error.message);
            });
    }

    deleteJob() {
        this.loading = true;
        deleteScheduledJob({ cronJobName: this.cronJobName })
            .then(data => {
                console.log('data', data);
                if (data) {
                    sessionStorage.removeItem('cron');
                    sessionStorage.removeItem('btn1');
                    sessionStorage.removeItem('btn2');
                    sessionStorage.removeItem('isDisabled');
                    this.state = "schedule";
                    this.currentCronAsTime = "";
                    this.stopLoading(500);
                    this.btn1 = "";
                    this.btn2 = "display:none";
                    this.isInputDisabled = false;
                    console.log("Job Deleted");
                    const evt = new ShowToastEvent({
                        title: 'Notification',
                        message: 'Scheduled Job is deleted',
                        variant: 'success',
                    });
                    this.dispatchEvent(evt);
                } else {
                    this.stopLoading(100);
                }
            })
            .catch(error => {
                this.stopLoading(100);
                console.log(error.message);
            });
    }

    handleTimeChange(event) {
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