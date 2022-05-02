let port;
var keepReading = false;
var reader;
var inputDone;
var outputDone;
var outputStream;

window.onload = function() {
  if(!detectBrowser()){
    alert("Please Note\nTo access the Serial Port through the Web Serial API, you must use Google Chrome browser or Microsoft Edge for now.");
  }
};

function startSerial() {
    openSerial()
}

async function closeSerial() {
    keepReading = false;

    reader.cancel();
    await inputDone.catch(() => {});

    outputStream.close();
    await outputDone;

    await port.close();
    window.SuccessMsg("Serial Port Closed", "The connected serial port is closed properly.");
    window.setSerialStatus(false);
}

function alertMessage(text) {
    alert(text)
}

function detectBrowser() {
    if(navigator.userAgent.indexOf("Chrome") != -1 ) {
        return true;
    }else {
        return false;
    }
}

async function openSerial() {
    try {
        port = await navigator.serial.requestPort({});
        await port.open({ baudRate: 115200, bufferSize: 10000  });

         const encoder = new TextEncoderStream();
         outputDone = encoder.readable.pipeTo(port.writable);
         outputStream = encoder.writable;

         let decoder = new TextDecoderStream();
         inputDone = port.readable.pipeTo(decoder.writable);
         inputStream = decoder.readable.pipeThrough(
           new TransformStream(new LineBreakTransformer())
         );

         reader = inputStream.getReader();
         keepReading = true;
         readLoop();

        } catch (e) {
            window.ErrorMsg("Serial Error", e.toString());
        }
}

async function readLoop() {
    window.SuccessMsg("Serial Read", "Begin to read data from the connected serial port.");
    window.setSerialStatus(true);
    while (keepReading) {
         try{
            const { value, done } = await reader.read();
            if (value) {
                 window.readSerialFunc(value);
               if (done) {
                    reader.releaseLock();
                break;
              }
            }
           }catch(e){
                keepReading = false;
                window.ErrorMsg("Serial Error", e.toString());
            }
    }
}

class LineBreakTransformer {
 constructor() {
   this.container = "";
 }

 transform(chunk, controller) {
   this.container += chunk;
   const lines = this.container.split("\r\n");
   this.container = lines.pop();
   lines.forEach((line) => controller.enqueue(line));
 }

 flush(controller) {
   controller.enqueue(this.container);
 }
}