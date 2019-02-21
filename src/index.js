import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import { Container } from 'react-inky';

// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
};

/**
 * Moves an item from one list to another list.
 */
const move = (source, destination, droppableSource, droppableDestination) => {
    const sourceClone = Array.from(source);
    const destClone = Array.from(destination);
    const [removed] = sourceClone.splice(droppableSource.index, 1);

    destClone.splice(droppableDestination.index, 0, removed);

    return { source: sourceClone, destination: destClone };
};

const grid = 8;

const getItemStyle = (isDragging, draggableStyle) => ({
    // some basic styles to make the items look a bit nicer
    userSelect: 'none',
    padding: grid * 2,
    margin: `0 0 ${grid}px 0`,

    // change background colour if dragging
    background: isDragging ? 'lightgreen' : 'grey',

    // styles we need to apply on draggables
    ...draggableStyle
});

const getListStyle = isDraggingOver => ({
    background: isDraggingOver ? 'lightblue' : 'lightgrey'
});

function dummyPost(id) {
    return {
        id,
        title: 'Article not found',
        content: `Article with id ${id} wasn't found`
    };
}

function ShortPost({ post }) {
    return (
        <article style={{ border: '2px solid #eee' }}>
            <h3>{post.title}</h3>
            {post.content}
        </article>
    );
}

function LongPost({ post }) {
    return (
        <article style={{ border: '2px solid #eee' }}>
            <h3>{post.title}</h3>
            {post.content}
        </article>
    );
}

const SECTIONS = ['main', 'common_solutions'];

function Newsletter({ sections }) {
    return (
        <div>
            Newsletter
            <DroppableContainer
                id="section_main"
                items={sections['main']}
                display={item => <ShortPost post={item} />}
            />
            Common Solutions Corner
            <DroppableContainer
                id="section_common_solutions"
                items={sections['common_solutions']}
                display={item => <ShortPost post={item} />}
            />
        </div>
    );
}

function DroppableContainer({ id, items, display }) {
    return (
        <Droppable droppableId={id}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    style={getListStyle(snapshot.isDraggingOver)}>
                    {items.map((item, index) => (
                        <Draggable
                            key={item.id}
                            draggableId={item.id}
                            index={index}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={getItemStyle(
                                        snapshot.isDragging,
                                        provided.draggableProps.style
                                    )}>
                                    {display(item)}
                                </div>
                            )}
                        </Draggable>
                    ))}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    );
}

class App extends Component {
    state = {
        posts: [
            {
                id: 'lily-no-sleep',
                title: 'Lily ne veut pas dormir',
                url: 'https://google.com',
                image: ''
            },
            {
                id: 'lily-still-no-sleep',
                title: 'Non mais vraiment, elle ne veut pas ...'
            }
        ],
        sections: {
            main: [
                {
                    id: 'lily-still-no-sleep'
                },
                {
                    id: 'lily-no-sleep'
                }
            ]
        }
    };

    onDragEnd = result => {
        const { source, destination } = result;
        console.log(result);

        // dropped outside the list
        if (!destination) {
            return;
        }

        if (source.droppableId === destination.droppableId) {
            if (source.droppableId === 'post_source') {
                return;
            }

            const sectionName = source.droppableId.replace(/^section_/, '');

            this.setState(state => ({
                sections: {
                    ...state.sections,
                    [sectionName]: reorder(
                        this.state.sections[sectionName],
                        source.index,
                        destination.index
                    )
                }
            }));

            return;
        }

        const newSections = {};

        // remove from old
        if (source.droppableId !== 'post_source') {
            const sourceSectionName = source.droppableId.replace(
                /^section_/,
                ''
            );
            const sourceClone = Array.from(
                this.state.sections[sourceSectionName] || []
            );
            sourceClone.splice(source.index, 1);
            newSections[sourceSectionName] = sourceClone;
        }

        // add to new
        if (destination.droppableId !== 'post_source') {
            const destinationSectionName = destination.droppableId.replace(
                /^section_/,
                ''
            );
            const destClone = Array.from(
                this.state.sections[destinationSectionName] || []
            );
            destClone.splice(destination.index, 0, { id: result.draggableId });
            newSections[destinationSectionName] = destClone;
        }

        this.setState({
            sections: {
                ...this.state.sections,
                ...newSections
            }
        });
    };

    getUnselected() {
        return this.state.posts.filter(
            post =>
                !Object.keys(this.state.sections)
                    .map(item => this.state.sections[item])
                    .reduce((acc, val) => acc.concat(val), [])
                    .find(selected => post.id === selected.id)
        );
    }

    getForSection(sectionName) {
        if (!this.state.sections[sectionName]) {
            return [];
        }

        return this.state.sections[sectionName].map(
            selected =>
                this.state.posts.find(post => post.id === selected.id) ||
                dummyPost(selected.id)
        );
    }

    render() {
        return (
            <DragDropContext onDragEnd={this.onDragEnd}>
                <aside>
                    <h1>Posts Source</h1>
                    <DroppableContainer
                        id="post_source"
                        items={this.getUnselected()}
                        display={item => <ShortPost post={item} />}
                    />
                </aside>
                <section>
                    <Newsletter
                        sections={SECTIONS.reduce((acc, key) => {
                            acc[key] = this.getForSection(key);
                            return acc;
                        }, {})}
                    />
                </section>
            </DragDropContext>
        );
    }
}

// Put the things into the DOM!
ReactDOM.render(<App />, document.getElementById('root'));
