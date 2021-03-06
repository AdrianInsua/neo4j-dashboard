import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Timeline from '../timeline/Timeline';
import CypherCodeMirror from './CypherCodeMirror';

import { codeMirrorSettings, neo4jSchema, toSchema } from './cypher/common';

import { cls, concatUniqueStrings } from '../../global/utils';
import { RowLayout, ColumnLayout } from '../../global/layouts';
import { useEventListener } from "../../global/utils/hooks/events";

import styles from './Comander.module.css';

function Comander() {
    const [query, setQuery] = useState("");
    const [queries, setQueries] = useState([]);
    const [showStored, setShowStored] = useState(false);
    const [highlightedSuggestion, setHighlightedSuggestion] = useState(-1);
    const [editor, setEditor] = useState(null);
    const schema = useRef(neo4jSchema);
    const cm = useRef(null);
    const storedQueries = useRef([]);
    const [theme, dbSchema] = useSelector(state => [state.theme, state.dbSchema]);

    useEffect(() => {
        Object.keys(dbSchema)
            .forEach(key =>
                schema.current[key] = [...schema.current[key], ...toSchema(key, dbSchema[key].records)]
            );
    }, [dbSchema])

    useEffect(() => {
        if (editor) {
            cm.current = editor.getCodeMirror();
        }
    }, [editor])

    useEffect(() => {
        const queries = localStorage.getItem("neo4jDashboard.queries");
        if (queries) {
            storedQueries.current = JSON.parse(queries);
        }
    }, []); // run only on component mount

    useEffect(() => {
        setQuery(storedQueries.current[highlightedSuggestion]);
    }, [highlightedSuggestion]); // run when highlightedsuggestion change

    const handlePlay = () => {
        const stored = concatUniqueStrings(query, storedQueries.current).slice(0, 10);
        setQueries(concatUniqueStrings(query, queries));
        setQuery("");
        setShowStored(false);
        storedQueries.current = stored;
        cm.current.setValue("");
        localStorage.setItem("neo4jDashboard.queries", JSON.stringify(stored));
    };

    const showStoredQueries = () => {
        setShowStored(!showStored);
    };

    const selectQuery = (event, query) => {
        event && event.preventDefault();
        setQuery(query);
        setShowStored(false);
        cm.current.setValue(query);
        cm.current.setCursor(cm.current.lineCount(), 0);
    };

    const deleteQuery = (query) => {
        setQueries(queries.filter(q => q !== query));
    }

    useEventListener("keydown", (event) => {
        switch (event.keyCode) {
            case 40: // ArrowDown
                setHighlightedSuggestion((hs) => {
                    return (hs === storedQueries.current.length - 1 ? 0 : hs + 1)
                });
                break;
            case 38: // ArrowUp
                setHighlightedSuggestion((hs) => (hs <= 0 ? storedQueries.current.length : hs) - 1);
                break;
            case 13: // Enter
                showStored && !query.length && selectQuery(event, storedQueries.current[highlightedSuggestion]);
                (!showStored || query.length) && handlePlay();
                break;
            default:
                break;
        }
    });

    return (
        <ColumnLayout
            data-testid="comander"
            dist="spaced center"
            className={cls(styles.comanderContainer, "animated", "fadeIn")}>
            <RowLayout dist="middle" className={styles.inputContainer}>
                <CypherCodeMirror
                    data-testid="codemirror"
                    className={styles.input}
                    options={{ ...codeMirrorSettings, ...{ theme: theme.codemirror } }}
                    schema={neo4jSchema}
                    defaultValue={""}
                    onChange={(value) => setQuery(value)}
                    ref={(el) => setEditor(el)}
                />
                <em className="material-icons" data-testid="play-trigger" onClick={handlePlay}>
                    play_arrow
                </em>
                <em
                    data-testid="stored-trigger"
                    className={cls("material-icons", showStored ? styles.activeIcon : "")}
                    onClick={showStoredQueries}
                >
                    history
                </em>
            </RowLayout>
            <div data-testid="show-stored" className={cls(styles.list, showStored ? styles.listActive : "")}>
                <span className={styles.listTitle}>Last queries</span>
                <ul className="hideScroll">
                    {storedQueries.current.map((q, i) => (
                        <li
                            data-testid="select-query-trigger"
                            key={i}
                            onClick={e => selectQuery(e, q)}
                            className={highlightedSuggestion === i ? styles.suggestionActive : ""}
                        >
                            <CypherCodeMirror
                                value={q}
                                options={{ ...codeMirrorSettings, ...{
                                    theme: theme.codemirror,
                                    autofocus: false,
                                    readOnly: 'nocursor'
                                } }}
                                schema={neo4jSchema}
                            />
                        </li>
                    ))}
                    {!storedQueries.current.length ? <span className={styles.noQueries}>No queries found</span> : null }
                </ul>
            </div>
            <Timeline
                data-testid="timeline"
                queries={queries}
                selectQuery={selectQuery}
                deleteQuery={deleteQuery}
            />
        </ColumnLayout>
    );
}

export default Comander;
