import { useState, FormEvent, ChangeEvent } from "react";
import { DefaultButton, Dropdown, IDropdownOption } from "@fluentui/react";
import styles from "./Info.module.css";
import { ExtractionLoading } from "../../components/Answer";
import github from "../../assets/invoice.jpg";

export function Component(): JSX.Element {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [responseData, setResponseData] = useState<any>(null);
    const [statusCode, setStatusCode] = useState<number | null>(null);
    const [selectedParser, setSelectedParser] = useState<string>("invoice");
    const [loading, setLoading] = useState<boolean>(false);
    const [showResponse, setShowResponse] = useState<boolean>(false);
    const [showPreview, setShowPreview] = useState<boolean>(false);
    const [fileUploaded, setFileUploaded] = useState<boolean>(false); // State to track if file is uploaded

    const invoice_data: { [key: string]: string | number } = {
        invoice_no: "QAP321316",
        vat_no: "PL12313",
        country: "Cayman Islands",
        currency: "USD",
        subtotal: 707.21,
        vat_percentage: "11.00%",
        date: "2024-01-10",
        total: 785.0,
        invoice_recipient: "Monica Hermiston",
        invoice_issuer: "Service Provider LTD",
        recipient_address: "55 East Gate Manchester, 111 3EE, Great Example",
        issuer_address: "Road 3, Gateway Tower, 47830, 10154, Sofiastad, Cayman Islands"
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            setSelectedFile(file);
            setFilePreview(URL.createObjectURL(file));
            setShowPreview(true);
            setFileUploaded(true); // Update state when file is selected
        }
    };

    const handleDropdownChange = (event: FormEvent<HTMLDivElement>, option?: IDropdownOption): void => {
        if (option) {
            setSelectedParser(option.data);
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedFile) {
            alert("Please select a file first!");
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("parser", selectedParser);

        try {
            const response = await fetch("https://information-extraction.azurewebsites.net/api/parser", {
                method: "POST",
                body: formData,
                redirect: "follow"
            });
            const text = await response.text();
            let parsedResponse;
            try {
                parsedResponse = JSON.parse(text);
                parsedResponse = JSON.parse(parsedResponse);
            } catch (parseError) {
                console.error("JSON parsing error:", parseError);
                setResponseData("Error parsing response");
                setStatusCode(null);
                return;
            }

            setResponseData(parsedResponse);
            setStatusCode(response.status);
            setShowResponse(true);
        } catch (error) {
            console.error("Error:", error);
            setResponseData("An error occurred");
            setStatusCode(null);
        } finally {
            setLoading(false);
        }
    };

    const renderFilePreview = () => {
        if (!filePreview) return null;
        if (selectedFile?.type.startsWith("image/")) {
            return <img src={filePreview} alt="File Preview" className={styles.filePreview} />;
        } else if (selectedFile?.type === "application/pdf") {
            return <embed src={filePreview} type="application/pdf" width="100%" height="600px" />;
        } else {
            return <p>File preview not available for this file type.</p>;
        }
    };
    const formatKey = (key: string): string => {
        return key
            .replace(/_/g, " ") // Replace underscores with spaces
            .toLowerCase() // Convert to lowercase
            .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize first letter of each word
    };
    const renderJsonData = (data: any) => {
        if (typeof data === "object" && data !== null) {
            return (
                <ul className={styles.jsonList}>
                    {Object.keys(data).map(key => (
                        <li key={key}>
                            <strong>{formatKey(key)}:</strong> {data[key]}
                        </li>
                    ))}
                </ul>
            );
        }
        return <p>No data to display</p>;
    };

    const exportJson = () => {
        if (!responseData) {
            alert("No data to export.");
            return;
        }
        const jsonString = JSON.stringify(responseData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "extracted-data.json";
        link.click();
        URL.revokeObjectURL(link.href);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Information Extraction</h1>
                <p className={styles.uploadS}>
                    Information Extraction is designed to streamline data extraction from invoices, sales orders, and other documents, enhancing accuracy and
                    efficiency in processing and analysis.
                </p>
            </div>

            {/* Form for File Upload */}
            <form onSubmit={handleSubmit} className={styles.uploadSection}>
                <input type="file" onChange={handleFileChange} className={styles.fileInput} />
                <Dropdown
                    className={styles.dropdown}
                    placeholder="Select an option"
                    options={[
                        { key: "invoices", text: "Invoices", data: "invoice" },
                        { key: "sales order", text: "Sales orders", data: "sales order" },
                        { key: "other", text: "General document analysis", data: "other" }
                    ]}
                    onChange={handleDropdownChange}
                    required
                />
                <DefaultButton text="Extract Information" type="submit" className={styles.uploadButton} />
            </form>

            {/* Static Invoice Image and Data Section */}
            {!fileUploaded && ( // Render only if no file is uploaded
                <div className={styles.row}>
                    <div className={styles.column}>
                        <div className={styles.uploadSection1}>
                            <img src={github} alt="Predefined Invoice" className={styles.invoiceImage} />
                        </div>
                    </div>
                    <div className={styles.column}>
                        <div className={styles.uploadSection1}>
                            <div className={styles.response}>
                                <h2>Invoice Data</h2>
                                <div className={styles.jsonContainer}>
                                    <ul className={styles.jsonList}>
                                        {Object.keys(invoice_data).map(key => (
                                            <li key={key}>
                                                <strong>{formatKey(key)}:</strong> {invoice_data[key]}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Dynamic Content */}
            <div className={styles.row}>
                <div className={styles.column}>
                    <div className={styles.filePreviewContainer} style={{ display: showPreview ? "block" : "none" }}>
                        {filePreview && <>{renderFilePreview()}</>}
                    </div>
                </div>
                <div className={styles.column} style={{ display: showPreview ? "block" : "none" }}>
                    <div className={styles.uploadSection1}>
                        {loading ? (
                            <div className={styles.loader}>
                                <ExtractionLoading />
                            </div>
                        ) : (
                            showResponse &&
                            responseData && (
                                <div>
                                    <div className={styles.responseContainer}>
                                        <h2>Extracted Information</h2>

                                        <div className={styles.exportContainer}>
                                            <DefaultButton text="Export as JSON" onClick={exportJson} />
                                        </div>
                                    </div>

                                    <div className={styles.jsonContainer}>
                                        <ul className={styles.jsonList}>{renderJsonData(responseData)}</ul>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

Component.displayName = "Ask";
