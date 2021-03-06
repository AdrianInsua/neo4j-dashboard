import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Summary from './components/Summary/Summary';
import Download from './components/Download/Download';

import { getQuery } from '../../service/neo.service';

import { ColumnLayout, RowLayout } from '../../global/layouts';
import Chart from '../../global/components/chart/Chart';
import { cls } from '../../global/utils';

import styles from './Card.module.css';
import actions from '../../global/utils/store/actions';

function Card(props) {
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [item, setItem] = useState(null);
    const [selected, setSelected] = useState(null);
    const [stats, setStats] = useState(null);
    const [expanded, setExpanded] = useState(false);
    const [download, setDownload] = useState(false);
    const [theme, fullscreen, user] = useSelector(state => [state.theme, state.theme.fullscreen, state.user]);
    const graphStyle = useSelector(state => state.graph);
    const dispatch = useDispatch();

    const query = useRef('');
    const visElement = useRef(null);

    useEffect(() => {
        dispatch(
            actions.graph.updateStyle({
                relationship: {
                    "text-color-external": theme.relColor,
                    "text-color-internal": theme.relColorInternal,
                },
            })
        );
    }, [dispatch, theme.relColor, theme.relColorInternal]);

    const fecthData = useCallback(async () => {
        try {
            const results = await getQuery(user.sessionId, props.query);
            setResults(results);
            setError(null);
        } catch (err) {
            setError(`${ props.query }: ${err}`);
        }
    }, [props.query, user.sessionId])

    useEffect(() => {
        /* istanbul ignore else */
        if (query.current !== props.query) {
            query.current = props.query;
            setResults(null);
            fecthData();
        }
    }, [props.query, fecthData]);

    const toggleExpand = () => {
        setExpanded(!expanded);
    }

    const toggleFullScreen = () => {
        dispatch(actions.theme.toggleFullScreen())
    };

    const toggleDownload = () => {
        setDownload(!download);
    }

    const itemHover = (_item) => {
        if (['node', 'relationship'].includes(_item.type)) {
            setItem(_item);
        } else if (_item.type === 'canvas') {
            setItem(null);
        }
    }

    const itemSelected = (item) => {
        setSelected(item)
    }

    const setSummary = (stats) => {
        setStats(stats);
    }

    const graphStyleCallback = (style) => {
        dispatch(actions.graph.updateStyle(style.toSheet()));
    }

    return (
        <ColumnLayout
            data-testid="card"
            className={cls(styles.card, expanded ? styles.expanded : "", fullscreen ? styles.fullscreen : "")}
        >
            <header className="row middle spaced">
                <span className={styles.cardTitle}>QUERY</span>
                <div
                    data-testid="restore-trigger"
                    className={styles.cardQuery}
                    onClick={() => props.restoreQuery(null, props.query)}>
                    {props.query}
                </div>
                <RowLayout dist="middle right" className={styles.iconContainer}>
                    <em
                        data-testid="toggle-download"
                        className="material-icons"
                        title="download"
                        onClick={toggleDownload}
                    >
                        save_alt
                    </em>
                    <em
                        data-testid="toggle-fullscreen"
                        className="material-icons"
                        title={fullscreen ? "minimize" : "maximize"}
                        onClick={toggleFullScreen}
                    >
                        {fullscreen ? "fullscreen_exit" : "fullscreen"}
                    </em>
                    <em
                        data-testid="toggle-expand"
                        className={cls(styles.expand, "material-icons", fullscreen ? "disabled" : "")}
                        title={expanded ? "contract" : "expand"}
                        onClick={fullscreen ? null : toggleExpand}
                    >
                        {expanded ? "unfold_less" : "unfold_more"}
                    </em>
                    <em className="material-icons" data-testid="delete-query"
                    title="close" onClick={() => props.deleteQuery(props.query)}>
                        close
                    </em>
                    {download ? (
                        <Download results={results} vis={visElement.current} className={styles.downloadWrapper} />
                    ) : null}
                </RowLayout>
            </header>
            {results ? (
                <RowLayout className={styles.cardBody}>
                    <ColumnLayout className={cls(styles.summary, fullscreen || expanded ? styles.summaryWidder : "")}>
                        <ColumnLayout className={cls(styles.summaryContainer, "hideScroll")}>
                            <h3>Summary</h3>
                            <Summary summary={stats} item={item || selected}></Summary>
                        </ColumnLayout>
                    </ColumnLayout>
                    <Chart
                        data-testid="chart"
                        style={{ width: "100%" }}
                        result={results}
                        maxNeighbours={30}
                        itemHovered={itemHover}
                        itemSelected={itemSelected}
                        setSummary={setSummary}
                        graphStyle={graphStyle}
                        graphStyleCallback={graphStyleCallback}
                        autoComplete={false}
                        zoomEnabled={true}
                        fullscreen={fullscreen}
                        assignVisElement={
                            /* istanbul ignore next */
                            (svgElement, graphElement) => (visElement.current = { svgElement, graphElement, type: "graph" })
                        }
                    />
                </RowLayout>
            ) : (
                <ColumnLayout data-testid="error" dist="center middle" className={cls(styles.cardBody, styles.loading)}>
                    {error ? error : <em className={cls("AppLoading", "material-icons")}>share</em>}
                </ColumnLayout>
            )}
        </ColumnLayout>
    );
}

export default Card;
