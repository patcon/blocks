import React from 'react';
import {storiesOf} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import Box from '../src/ui/box';
import Button, {buttonStylePropTypes} from '../src/ui/button';
import Tooltip from '../src/ui/tooltip';
import useTheme from '../src/ui/theme/use_theme';
import {keys} from '../src/private_utils';
import Example from './helpers/example';
import {createJsxPropsStringFromValuesMap, createJsxComponentString} from './helpers/code_utils';

const stories = storiesOf('Button', module);

function ButtonExample() {
    const {buttonVariants, buttonSizes} = useTheme();
    return (
        <Example
            options={{
                variant: {
                    type: 'select',
                    label: 'Variant',
                    options: keys(buttonVariants),
                },
                size: {
                    type: 'selectButtons',
                    label: 'Size',
                    options: keys(buttonSizes),
                },
                disabled: {
                    type: 'switch',
                    label: 'Disabled',
                    defaultValue: false,
                },
                icon: {
                    type: 'switch',
                    label: 'Show icon',
                    defaultValue: true,
                },
                hasLabel: {
                    type: 'switch',
                    label: 'Show label',
                    defaultValue: true,
                },
            }}
            styleProps={Object.keys(buttonStylePropTypes)}
            renderCodeFn={({hasLabel, ...values}) => {
                const props = createJsxPropsStringFromValuesMap(values as any, {
                    icon: value => (value ? 'edit' : null),
                });

                const ariaLabel = hasLabel ? '' : 'aria-label="Edit"';
                const ariaLabelComment = hasLabel
                    ? ''
                    : '// Make sure to add an "aria-label" prop when only using an icon.';

                const children = hasLabel ? 'Button' : null;

                const buttonComponentString = createJsxComponentString(
                    'Button',
                    ["onClick={() => console.log('Button clicked')}", props, ariaLabel],
                    children,
                );

                return `
                    import {Button} from '@airtable/blocks/ui';
                    
                    ${ariaLabelComment}
                    const buttonExample = (
                        ${buttonComponentString}
                    );
                `;
            }}
        >
            {({icon, hasLabel, ...values}) => (
                <Button
                    // eslint-disable-next-line no-console
                    onClick={() => console.log('Button clicked')}
                    {...values}
                    icon={icon ? 'edit' : undefined}
                    aria-label={hasLabel ? 'Edit' : undefined}
                >
                    {hasLabel ? 'Button' : null}
                </Button>
            )}
        </Example>
    );
}

stories.add('example', () => <ButtonExample />);

stories.add('variants & sizes', () => (
    <React.Fragment>
        <Box margin={5}>
            <Button icon="edit" size="small" onClick={action('clicked')} marginRight={2}>
                Default
            </Button>
            <Button
                icon="plus"
                size="small"
                variant="primary"
                onClick={action('clicked')}
                marginRight={2}
            >
                Primary
            </Button>
            <Button size="small" variant="secondary" onClick={action('clicked')} marginRight={2}>
                Secondary
            </Button>
            <Button
                icon="trash"
                size="small"
                variant="danger"
                onClick={action('clicked')}
                marginRight={2}
            >
                Danger
            </Button>
        </Box>
        <Box margin={5}>
            <Button icon="edit" onClick={action('clicked')} marginRight={2}>
                Default
            </Button>
            <Button icon="plus" variant="primary" onClick={action('clicked')} marginRight={2}>
                Primary
            </Button>
            <Button icon="filter" variant="secondary" onClick={action('clicked')} marginRight={2}>
                Secondary
            </Button>
            <Button icon="trash" variant="danger" onClick={action('clicked')} marginRight={2}>
                Danger
            </Button>
        </Box>
        <Box margin={5}>
            <Button icon="edit" size="large" onClick={action('clicked')} marginRight={2}>
                Default
            </Button>
            <Button
                icon="plus"
                size="large"
                variant="primary"
                onClick={action('clicked')}
                marginRight={2}
            >
                Primary
            </Button>
            <Button
                icon="filter"
                size="large"
                variant="secondary"
                onClick={action('clicked')}
                marginRight={2}
            >
                Secondary
            </Button>
            <Button
                icon="trash"
                size="large"
                variant="danger"
                onClick={action('clicked')}
                marginRight={2}
            >
                Danger
            </Button>
        </Box>
    </React.Fragment>
));

stories.add('with icon', () => (
    <Button icon="upload" onClick={action('clicked')}>
        With icon
    </Button>
));

stories.add('with icon, no children', () => (
    <Button icon="upload" aria-label="upload" onClick={action('clicked')} />
));

stories.add('responsive size', () => (
    <Button
        size={{xsmallViewport: 'small', mediumViewport: 'default', largeViewport: 'large'}}
        onClick={action('clicked')}
    >
        Resize the window
    </Button>
));

stories.add('disabled', () => (
    <Button disabled={true} onClick={action('clicked')}>
        Disabled
    </Button>
));

stories.add('aria-label', () => (
    <Button aria-label="Aria label" onClick={action('clicked')}>
        This should be an icon
    </Button>
));

stories.add('type="submit"', () => (
    <Button type="submit" onClick={action('clicked')}>
        Submit
    </Button>
));

stories.add('full width', () => (
    <Box padding={4}>
        <Button icon="edit" width="100%">
            Full width
        </Button>
    </Box>
));

stories.add('truncate', () => (
    <Box padding={4} maxWidth="80px">
        <Button icon="edit" width="100%">
            Full width
        </Button>
    </Box>
));

stories.add('display', () => (
    <Box padding={4}>
        {(['flex', 'inline-flex', 'none'] as const).map(display => (
            <Button key={display} display={display} margin={2}>
                {display}
            </Button>
        ))}
    </Box>
));

stories.add('ref', () => (
    <React.Fragment>
        <Button
            ref={node => {
                // eslint-disable-next-line no-console
                console.log(node);
            }}
        >
            Look into your console to see the ref
        </Button>
    </React.Fragment>
));

stories.add('custom icon', () => (
    <Button
        icon={
            <svg
                viewBox="0 0 24 24"
                preserveAspectRatio="xMidYMid meet"
                style={{flex: 'none', width: '1em', height: '1em'}}
            >
                <path
                    fill="currentColor"
                    d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"
                ></path>
            </svg>
        }
        size="large"
    >
        Custom icon
    </Button>
));

stories.add('with tooltip', () => (
    <Tooltip
        content="Tooltip content"
        placementX={Tooltip.placements.CENTER}
        placementY={Tooltip.placements.BOTTOM}
        placementOffsetX={0}
        placementOffsetY={8}
    >
        <Button onClick={action('Clicked')}>Button with tooltip</Button>
    </Tooltip>
));
