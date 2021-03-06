import React from 'react';
import { saveAs } from "file-saver";

import { stringifyResultArray, transformResultRecordsToResultArray } from './utils/utils';
import { CSVSerializer } from './utils/csvHelper';
import { downloadPNGFromSVG, downloadSVG } from './utils/exporting/imageUtils';
import { ColumnLayout } from '../../../../global/layouts';
import { csvFormat, recordToJSONMapper } from '../../../../global/components/chart/utils/cypher-utils';

import styles from './Download.module.css';

function Download(props) {

    const exportCSV = () => {
        const exportData = stringifyResultArray(csvFormat, transformResultRecordsToResultArray(props.results.records));
        const data = exportData.slice();
        const csv = CSVSerializer(data.shift());
        csv.appendRows(data);
        var blob = new Blob([csv.output()], {
            type: "text/plain;charset=utf-8",
        });
        saveAs(blob, "export.csv");
    }

    const exportJSON = () => {
        const data = JSON.stringify(
            props.results.records.map(recordToJSONMapper),
            null,
            2
        )
        const blob = new Blob([data], {
            type: 'text/plain;charset=utf-8'
        })

        saveAs(blob, 'records.json')
    }

    const exportPNG = () => {
        const { svgElement, graphElement, type } = props.vis
        downloadPNGFromSVG(svgElement, graphElement, type)
    }

    const exportSVG = () => {
        const { svgElement, graphElement, type } = props.vis
        downloadSVG(svgElement, graphElement, type)
    }

    return (
        <ColumnLayout data-testid="download" dist="left" className={props.className}>
            <div className={styles.listItem} data-testid="csv-trigger" onClick={exportCSV}>
                Export to CSV
            </div>
            <div className={styles.listItem} data-testid="json-trigger" onClick={exportJSON}>
                Export to JSON
            </div>
            <div className={styles.listItem} data-testid="png-trigger" onClick={exportPNG}>
                Export to PNG
            </div>
            <div className={styles.listItem} data-testid="svg-trigger" onClick={exportSVG}>
                Export to SVG
            </div>
        </ColumnLayout>
    );
}

export default Download;
