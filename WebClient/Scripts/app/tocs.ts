// Interface
interface ITrainOperatingCompany {
    code: string;
    name: string;
}

// Module
module TrainNotifier {

    // Class
    export class TrainOperatingCompany implements ITrainOperatingCompany {
        // Constructor
        constructor(public code: string, public name: string) { }

    }
}

var tocs: Array<ITrainOperatingCompany> = [];
tocs.push(new TrainNotifier.TrainOperatingCompany("", "All"));
tocs.push(new TrainNotifier.TrainOperatingCompany("ZZ", "Freight"));
tocs.push(new TrainNotifier.TrainOperatingCompany("AW", "Arriva Trains Wales"));
tocs.push(new TrainNotifier.TrainOperatingCompany("CC", "c2c"));
tocs.push(new TrainNotifier.TrainOperatingCompany("CH", "Chiltern Railways Company"));
tocs.push(new TrainNotifier.TrainOperatingCompany("XC", "CrossCountry"));
tocs.push(new TrainNotifier.TrainOperatingCompany("EM", "East Midlands Trains"));
tocs.push(new TrainNotifier.TrainOperatingCompany("ES", "Eurostar (UK)"));
tocs.push(new TrainNotifier.TrainOperatingCompany("PT", "Europorte 2"));
tocs.push(new TrainNotifier.TrainOperatingCompany("FC", "First Capital Connect"));
tocs.push(new TrainNotifier.TrainOperatingCompany("GW", "First Great Western"));
tocs.push(new TrainNotifier.TrainOperatingCompany("HT", "First Hull Trains"));
tocs.push(new TrainNotifier.TrainOperatingCompany("TP", "First TransPennine Express"));
tocs.push(new TrainNotifier.TrainOperatingCompany("GX", "Gatwick Express"));
tocs.push(new TrainNotifier.TrainOperatingCompany("GC", "Grand Central"));
tocs.push(new TrainNotifier.TrainOperatingCompany("GN", "Great Northern"));
tocs.push(new TrainNotifier.TrainOperatingCompany("HC", "Heathrow Connect"));
tocs.push(new TrainNotifier.TrainOperatingCompany("HX", "Heathrow Express"));
tocs.push(new TrainNotifier.TrainOperatingCompany("IL", "Island Line"));
tocs.push(new TrainNotifier.TrainOperatingCompany("LM", "London Midland"));
tocs.push(new TrainNotifier.TrainOperatingCompany("LO", "London Overground"));
tocs.push(new TrainNotifier.TrainOperatingCompany("LT", "London Underground (LT)"));
tocs.push(new TrainNotifier.TrainOperatingCompany("LU", "London Underground (LU)"));
tocs.push(new TrainNotifier.TrainOperatingCompany("ME", "Merseyrail "));
tocs.push(new TrainNotifier.TrainOperatingCompany("LE", "National Express East Anglia"));
tocs.push(new TrainNotifier.TrainOperatingCompany("GR", "National Express East Coast"));
tocs.push(new TrainNotifier.TrainOperatingCompany("NT", "Northern"));
tocs.push(new TrainNotifier.TrainOperatingCompany("NY", "North Yorkshire Moors Railway"));
tocs.push(new TrainNotifier.TrainOperatingCompany("SR", "ScotRail"));
tocs.push(new TrainNotifier.TrainOperatingCompany("SE", "Southeastern"));
tocs.push(new TrainNotifier.TrainOperatingCompany("SN", "Southern"));
tocs.push(new TrainNotifier.TrainOperatingCompany("SW", "South West Trains"));
tocs.push(new TrainNotifier.TrainOperatingCompany("TL", "Thameslink"));
tocs.push(new TrainNotifier.TrainOperatingCompany("TW", "Tyne & Wear Metro"));
tocs.push(new TrainNotifier.TrainOperatingCompany("VT", "Virgin Trains"));
tocs.push(new TrainNotifier.TrainOperatingCompany("WR", "West Coast Railway Company"));
tocs.push(new TrainNotifier.TrainOperatingCompany("WS", "Wrexham & Shropshire"));